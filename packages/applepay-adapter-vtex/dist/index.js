// src/flow.ts
import {
  createBrowserApplePayClient,
  getApplePayBaseRequest,
  getApplePayCancelRequest,
  getApplePayCompleteRequest,
  isBillingContactValid,
  isShippingContactValid
} from "@cielo/applepay-headless-vtex";
var DEFAULT_APPLE_PAY_REQUEST_CONFIG = {
  countryCode: "BR",
  currencyCode: "BRL",
  merchantCapabilities: ["supports3DS", "supportsCredit"],
  supportedNetworks: ["masterCard", "visa"],
  requiredBillingContactFields: ["postalAddress"],
  requiredShippingContactFields: ["name", "email", "phone"],
  totalLabel: "Cielo Store",
  totalType: "final"
};
async function cancelPreparedOrder(prepared, cancelOrder, onError) {
  const candidates = [prepared.orderId, prepared.orderReference].filter(
    (value, index, arr) => Boolean(value) && arr.indexOf(value) === index
  );
  for (const candidate of candidates) {
    const cancelled = await cancelOrder(candidate);
    if (cancelled) {
      return;
    }
  }
  if (candidates.length > 0) {
    onError("Nao foi possivel confirmar o cancelamento automatico do pedido. Verifique o status em Meus pedidos.");
  }
}
function CieloApplePaySetup() {
  let clientOpenSession;
  let clientCancel;
  let strictDeviceValidation = true;
  let ClientRequestConfig = {
    ...DEFAULT_APPLE_PAY_REQUEST_CONFIG
  };
  function Init2(options) {
    clientOpenSession = options?.clientOpenSession;
    clientCancel = options?.clientCancel;
    strictDeviceValidation = options?.strictDeviceValidation ?? true;
    ClientRequestConfig = {
      ...DEFAULT_APPLE_PAY_REQUEST_CONFIG,
      ...options?.ClientRequestConfig ?? {}
    };
  }
  async function startVtexApplePayFlow2(deps) {
    const getStartupErrorMessage = (error) => {
      if (error instanceof Error && error.message) {
        return error.message;
      }
      if (typeof error === "string" && error.trim().length > 0) {
        return error;
      }
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message ?? "").trim();
        if (message) return message;
      }
      return "Nao foi possivel iniciar a sessao do Apple Pay.";
    };
    const isBrowserApplePayAvailable = typeof window !== "undefined" && typeof window.ApplePaySession !== "undefined";
    const client = createBrowserApplePayClient(3);
    if (typeof window !== "undefined" && window.location.protocol !== "https:") {
      deps.onError("Apple Pay requer HTTPS. Acesse a loja por um dom\xEDnio seguro (https://) para usar este meio de pagamento.");
      return;
    }
    if (!isBrowserApplePayAvailable) {
      deps.onError("Apple Pay indisponivel neste navegador. Use Safari em um dispositivo compativel.");
      return;
    }
    if (strictDeviceValidation && !client.canMakePayments()) {
      deps.onError("Apple Pay n\xE3o est\xE1 dispon\xEDvel neste dispositivo.");
      return;
    }
    const ctx = { prepared: null, fullPayload: null };
    async function prepareVtexOrderBeforeOpenSession() {
      const prepared = await deps.prepareOrder();
      ctx.prepared = prepared;
      const processResult = await deps.processPlacedOrder(prepared.orderReference);
      const applePayApp = processResult?.apps?.find((app) => /ewallet|applepay|apple.pay/i.test(app.appName));
      if (!applePayApp?.appPayload) {
        throw new Error("Connector Cielo n\xE3o retornou paymentAppData para Apple Pay. Verifique a configura\xE7\xE3o do connector.");
      }
      const parsedPayload = JSON.parse(applePayApp.appPayload);
      parsedPayload.MerchantUrl = window.location.origin.replace(/^https?:\/\//, "");
      return parsedPayload;
    }
    const preparedPayloadPromise = prepareVtexOrderBeforeOpenSession();
    const request = getApplePayBaseRequest(
      { Amount: deps.initialAmount },
      ClientRequestConfig
    );
    try {
      const session = client.createSession(request, {
        onValidateMerchant: async () => {
          try {
            const preparedPayload = await preparedPayloadPromise;
            const openSession = clientOpenSession ?? requestApplePaySession;
            const sessionResponse = await openSession(preparedPayload);
            const fullPayload = JSON.parse(sessionResponse.Response);
            const mergedPayload = {
              ...preparedPayload,
              ...fullPayload,
              BearerToken: fullPayload.BearerToken ?? preparedPayload.BearerToken,
              AppleSessionResponse: fullPayload.AppleSessionResponse
            };
            ctx.fullPayload = mergedPayload;
            session.completeMerchantValidation(fullPayload.AppleSessionResponse);
          } catch (error) {
            session.completePaymentFailure();
            if (ctx.prepared) {
              void cancelPreparedOrder(ctx.prepared, deps.cancelOrder, deps.onError);
            }
            deps.onError(error.message ?? "Erro ao validar merchant Apple Pay.");
          }
        },
        onPaymentAuthorized: async (event) => {
          const { prepared, fullPayload } = ctx;
          if (!prepared || !fullPayload) {
            session.completePaymentFailure();
            deps.onError("Estado do fluxo Apple Pay inv\xE1lido.");
            return;
          }
          const errors = [];
          if (!isBillingContactValid(event.payment.billingContact)) {
            errors.push({ code: "billingContactInvalid", contactField: "postalCode", message: "Endere\xE7o de cobran\xE7a incompleto." });
            session.completePaymentFailure(errors);
            await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError);
            return;
          }
          if (!isShippingContactValid(event.payment.shippingContact)) {
            errors.push({ code: "shippingContactInvalid", contactField: "givenName", message: "Dados de contato incompletos." });
            session.completePaymentFailure(errors);
            await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError);
            return;
          }
          try {
            const walletRequest = getApplePayCompleteRequest(fullPayload, event);
            const approved = await requestApplePayComplete(fullPayload, walletRequest);
            if (!approved) {
              session.completePaymentFailure();
              deps.onError("Pagamento Apple Pay n\xE3o autorizado pelo emissor.");
              await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError);
              return;
            }
            try {
              await deps.processPlacedOrder(prepared.orderReference);
            } catch {
            }
            session.completePaymentSuccess();
            deps.onSuccess(prepared.orderReference);
          } catch (error) {
            session.completePaymentFailure();
            deps.onError(error.message ?? "Erro ao processar pagamento Apple Pay.");
            await cancelPreparedOrder(prepared, deps.cancelOrder, deps.onError);
          }
        },
        onCancel: async () => {
          const { prepared, fullPayload } = ctx;
          if (!fullPayload || !prepared) return;
          const cancelRequest = getApplePayCancelRequest(fullPayload);
          const cancelPayment = clientCancel ?? requestApplePayCancel;
          await cancelPayment(fullPayload, cancelRequest).catch(() => {
          });
          await cancelPreparedOrder(prepared, deps.cancelOrder, () => {
          });
        }
      });
      preparedPayloadPromise.then(() => {
        session.begin();
      }).catch((error) => {
        if (ctx.prepared) {
          void cancelPreparedOrder(ctx.prepared, deps.cancelOrder, deps.onError);
        }
        deps.onError(getStartupErrorMessage(error));
      });
    } catch (error) {
      deps.onError(getStartupErrorMessage(error));
    }
  }
  return {
    Init: Init2,
    startVtexApplePayFlow: startVtexApplePayFlow2
  };
}
var defaultSetup = CieloApplePaySetup();
var Init = defaultSetup.Init;
var startVtexApplePayFlow = defaultSetup.startVtexApplePayFlow;

// src/index.ts
function createVtexTransactionGateway(deps) {
  return {
    prepareTransaction: deps.prepare,
    finalizeTransaction: deps.finalize,
    failTransaction: deps.fail
  };
}
function createVtexApplePayConnector(deps) {
  return {
    openMerchantSession: deps.session,
    completePayment: deps.complete,
    cancelPayment: deps.cancel
  };
}
async function postCielo(path, body, apiUrl, merchantId, bearerToken) {
  const url = `${apiUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VTEX-API-AppKey": merchantId ?? "",
      "Authorization": bearerToken ?? ""
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Falha na requisicao Apple Pay ao connector Cielo (${url}) - HTTP ${response.status}: ${text || "(sem corpo)"}`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
async function requestApplePaySession(appPayload) {
  return postCielo(
    "/wallets/v2/applepayopensession",
    {
      PaymentId: appPayload.PaymentId,
      OriginRequestId: appPayload.OriginRequestId,
      MerchantUrl: appPayload.MerchantUrl
    },
    appPayload.ApiUrl,
    appPayload.MerchantId,
    appPayload.BearerToken
  );
}
async function requestApplePayComplete(appPayload, walletRequest) {
  return postCielo(
    "/wallets/v2/applepaycomplete",
    {
      PaymentId: walletRequest.PaymentId,
      WalletKey: walletRequest.WalletKey,
      EphemeralPublicKey: walletRequest.EphemeralPublicKey
    },
    appPayload.ApiUrl,
    appPayload.MerchantId,
    appPayload.BearerToken
  );
}
async function requestApplePayCancel(appPayload, cancelRequest) {
  await postCielo(
    "/wallets/v2/applepaycancel",
    {
      PaymentId: cancelRequest.PaymentId
    },
    appPayload.ApiUrl,
    appPayload.MerchantId,
    appPayload.BearerToken
  );
}
export {
  CieloApplePaySetup,
  Init,
  createVtexApplePayConnector,
  createVtexTransactionGateway,
  postCielo,
  requestApplePayCancel,
  requestApplePayComplete,
  requestApplePaySession,
  startVtexApplePayFlow
};
//# sourceMappingURL=index.js.map