"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApplePayButton: () => ApplePayButton,
  ApplePayModal: () => ApplePayModal,
  useApplePay: () => useApplePay,
  useApplePaySdk: () => useApplePaySdk
});
module.exports = __toCommonJS(index_exports);

// src/useApplePay.ts
var import_react = require("react");
var import_applepay_headless_vtex = require("@cielo/applepay-headless-vtex");
function useApplePay(params) {
  const { transactions, connector, client, onSuccess, onError, onCancel } = params;
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const parsePayload = (0, import_react.useMemo)(
    () => params.parsePayload ?? ((raw) => JSON.parse(raw)),
    [params.parsePayload]
  );
  const requestConfig = (0, import_react.useMemo)(() => params.requestConfig, [params.requestConfig]);
  const orchestrator = (0, import_react.useMemo)(
    () => (0, import_applepay_headless_vtex.createApplePayOrchestrator)({
      transactions,
      connector,
      client,
      parsePayload,
      requestConfig,
      onSuccess,
      onError: (message) => {
        setError(message);
        onError?.(message);
      },
      onCancel
    }),
    [transactions, connector, client, parsePayload, requestConfig, onSuccess, onError, onCancel]
  );
  const start = (0, import_react.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      await orchestrator.start();
    } catch (e) {
      const message = e.message ?? "Failed to start Apple Pay flow.";
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [orchestrator, onError]);
  return {
    start,
    loading,
    error
  };
}

// src/useApplePaySdk.ts
var import_react2 = require("react");
var DEFAULT_SDK_URL = "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
function useApplePaySdk({
  scriptId = "apple-pay-sdk",
  sdkUrl = DEFAULT_SDK_URL,
  getIsReady,
  errorMessage = "Falha ao carregar SDK do Apple Pay."
} = {}) {
  const [sdkReady, setSdkReady] = (0, import_react2.useState)(() => {
    if (typeof document === "undefined") return false;
    if (getIsReady?.()) return true;
    return Boolean(document.getElementById(scriptId));
  });
  const [sdkError, setSdkError] = (0, import_react2.useState)(null);
  const scriptLoadedRef = (0, import_react2.useRef)(false);
  (0, import_react2.useEffect)(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (sdkReady || getIsReady?.() || document.getElementById(scriptId)) {
      return;
    }
    if (scriptLoadedRef.current) {
      return;
    }
    scriptLoadedRef.current = true;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = sdkUrl;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setSdkReady(Boolean(getIsReady?.() ?? true));
    };
    script.onerror = () => {
      setSdkError(errorMessage);
    };
    document.head.appendChild(script);
  }, [sdkReady, scriptId, sdkUrl, getIsReady, errorMessage]);
  return {
    sdkReady,
    sdkError
  };
}

// src/ApplePayButton.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ApplePayButton({
  loading,
  disabled,
  sdkScriptId = "apple-pay-sdk",
  sdkUrl = "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js",
  sdkLoadingLabel = "Carregando Apple Pay...",
  sdkErrorLabel = "Falha ao carregar SDK do Apple Pay.",
  ...rest
}) {
  const { sdkReady, sdkError } = useApplePaySdk({
    scriptId: sdkScriptId,
    sdkUrl,
    errorMessage: sdkErrorLabel
  });
  if (sdkError) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs text-red-700", children: sdkError });
  }
  if (!sdkReady) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs text-[#8699ad]", children: sdkLoadingLabel });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      disabled: disabled || loading,
      style: {
        display: "block",
        width: "100%",
        border: "none",
        background: "none",
        padding: 0,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1
      },
      "aria-label": "Pagar com Apple Pay",
      ...rest,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "apple-pay-button",
        {
          buttonstyle: "black",
          type: "buy",
          locale: "pt-BR",
          style: { width: "100%", height: "48px", "--apple-pay-button-border-radius": "10px" }
        }
      )
    }
  );
}

// src/ApplePayModal.tsx
var import_react3 = require("react");
var import_applepay_headless_vtex2 = require("@cielo/applepay-headless-vtex");

// ../applepay-adapter-vtex/src/index.ts
async function postCielo(path, body, apiUrl, merchantId) {
  const url = `${apiUrl}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VTEX-API-AppKey": merchantId ?? ""
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
async function requestApplePayComplete(appPayload, walletRequest) {
  return postCielo(
    "/wallet/applepaycomplete",
    {
      PaymentId: walletRequest.PaymentId,
      WalletKey: walletRequest.WalletKey,
      EphemeralPublicKey: walletRequest.EphemeralPublicKey
    },
    appPayload.ApiUrl,
    appPayload.MerchantId
  );
}
async function requestApplePayCancel(appPayload, cancelRequest) {
  await postCielo(
    "/wallet/applepaycancel",
    {
      PaymentId: cancelRequest.PaymentId
    },
    appPayload.ApiUrl,
    appPayload.MerchantId
  );
}

// src/ApplePayModal.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function ApplePayModal({
  sessionState,
  requestConfig,
  onSuccess,
  onError,
  onCancel
}) {
  const { appPayload, orderGroup } = sessionState;
  const { sdkReady, sdkError } = useApplePaySdk();
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const [flowError, setFlowError] = (0, import_react3.useState)(null);
  async function handleApplePayClick() {
    const client = (0, import_applepay_headless_vtex2.createBrowserApplePayClient)(3);
    if (!client.canMakePayments()) {
      setFlowError("Este dispositivo nao suporta Apple Pay. Verifique se ha um cartao cadastrado na sua Carteira.");
      return;
    }
    setFlowError(null);
    setLoading(true);
    const request = (0, import_applepay_headless_vtex2.getApplePayBaseRequest)(appPayload, requestConfig);
    const session = client.createSession(request, {
      onValidateMerchant: async () => {
        session.completeMerchantValidation(appPayload.AppleSessionResponse);
      },
      onPaymentAuthorized: async (event) => {
        const errors = [];
        if (!(0, import_applepay_headless_vtex2.isBillingContactValid)(event.payment.billingContact)) {
          errors.push({ code: "billingContactInvalid", contactField: "postalCode", message: "Endereco de cobranca incompleto." });
          session.completePaymentFailure(errors);
          return;
        }
        if (!(0, import_applepay_headless_vtex2.isShippingContactValid)(event.payment.shippingContact)) {
          errors.push({ code: "shippingContactInvalid", contactField: "givenName", message: "Dados de contato incompletos." });
          session.completePaymentFailure(errors);
          return;
        }
        try {
          const walletRequest = (0, import_applepay_headless_vtex2.getApplePayCompleteRequest)(appPayload, event);
          await requestApplePayComplete(appPayload, walletRequest);
          session.completePaymentSuccess();
          onSuccess(orderGroup);
        } catch (err) {
          session.completePaymentFailure();
          onError(err.message ?? "Erro ao processar pagamento Apple Pay.");
        } finally {
          setLoading(false);
        }
      },
      onCancel: async () => {
        const cancelRequest = (0, import_applepay_headless_vtex2.getApplePayCancelRequest)(appPayload);
        await requestApplePayCancel(appPayload, cancelRequest).catch(() => {
        });
        setLoading(false);
        onCancel();
      }
    });
    session.begin();
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Pagamento com Apple Pay",
      className: "fixed inset-0 z-[9999] grid place-items-center bg-black/40 p-4",
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "w-full max-w-sm rounded-xl border border-[#d8e1ec] bg-white p-7 shadow-2xl sm:p-8", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col items-center gap-5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "svg",
          {
            width: "40",
            height: "40",
            viewBox: "0 0 40 40",
            fill: "none",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { width: "40", height: "40", rx: "8", fill: "#000" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "path",
                {
                  d: "M20.5 11c1.1-1.3 2.8-2.2 4.2-2.2.2 1.6-.5 3.2-1.5 4.3-1 1.1-2.6 2-4.1 1.9-.2-1.5.5-3.1 1.4-4zm-1.3 5.5c-2.2 0-4.2 1.3-5.2 1.3-1.1 0-2.8-1.2-4.7-1.2-2.4.1-4.6 1.4-5.8 3.6-2.5 4.3-.7 10.6 1.7 14.1 1.2 1.7 2.6 3.5 4.5 3.5 1.8-.1 2.4-1.1 4.6-1.1 2.2 0 2.7 1.1 4.6 1.1 1.9-.1 3.1-1.8 4.3-3.5.7-1 1.2-2.1 1.6-3.1-4.2-1.6-4.8-7.7-.7-10-1.2-1.5-3-2.7-5-2.7z",
                  fill: "white"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "space-y-1 text-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-lg font-semibold text-[#304258]", children: "Pagamento com Apple Pay" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "text-sm text-[#5f7592]", children: [
            "Confirme o pagamento de",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL"
            }).format(Number(appPayload.Amount) / 100) }),
            " ",
            "com Touch ID ou Face ID."
          ] })
        ] }),
        (sdkError || flowError) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "w-full rounded-lg border border-red-700/20 bg-red-50 px-3 py-2 text-center text-sm text-red-800", children: sdkError ?? flowError }),
        sdkReady && !sdkError && !flowError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            disabled: loading,
            onClick: () => {
              void handleApplePayClick();
            },
            className: "block w-full border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60",
            "aria-label": "Pagar com Apple Pay",
            children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "apple-pay-button",
              {
                buttonstyle: "black",
                type: "buy",
                locale: "pt-BR",
                style: { width: "100%", height: "48px", "--apple-pay-button-border-radius": "10px" }
              }
            )
          }
        ),
        !sdkReady && !sdkError && !flowError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-sm text-[#8699ad]", children: "Carregando Apple Pay..." }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            onClick: onCancel,
            disabled: loading,
            className: "bg-transparent text-sm font-medium text-[var(--brand)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
            children: "Cancelar e escolher outro meio de pagamento"
          }
        )
      ] }) })
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApplePayButton,
  ApplePayModal,
  useApplePay,
  useApplePaySdk
});
//# sourceMappingURL=index.cjs.map