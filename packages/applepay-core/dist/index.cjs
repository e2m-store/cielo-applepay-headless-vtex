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
  createApplePayOrchestrator: () => createApplePayOrchestrator,
  createBrowserApplePayClient: () => createBrowserApplePayClient,
  getApplePayBaseRequest: () => getApplePayBaseRequest,
  getApplePayCancelRequest: () => getApplePayCancelRequest,
  getApplePayCompleteRequest: () => getApplePayCompleteRequest,
  isBillingContactValid: () => isBillingContactValid,
  isShippingContactValid: () => isShippingContactValid
});
module.exports = __toCommonJS(index_exports);

// src/helpers.ts
var DEFAULT_APPLE_PAY_REQUEST_CONFIG = {
  countryCode: "BR",
  currencyCode: "BRL",
  merchantCapabilities: ["supports3DS", "supportsCredit"],
  supportedNetworks: ["masterCard", "visa"],
  requiredBillingContactFields: ["postalAddress"],
  requiredShippingContactFields: ["name", "email", "phone"],
  totalLabel: "",
  totalType: "final"
};
function getApplePayBaseRequest(appPayload, config) {
  const mergedConfig = {
    ...DEFAULT_APPLE_PAY_REQUEST_CONFIG,
    ...config
  };
  return {
    countryCode: mergedConfig.countryCode,
    currencyCode: mergedConfig.currencyCode,
    merchantCapabilities: mergedConfig.merchantCapabilities,
    supportedNetworks: mergedConfig.supportedNetworks,
    requiredBillingContactFields: mergedConfig.requiredBillingContactFields,
    requiredShippingContactFields: mergedConfig.requiredShippingContactFields,
    total: {
      label: mergedConfig.totalLabel,
      type: mergedConfig.totalType,
      amount: appPayload.Amount
    }
  };
}
function getApplePayCompleteRequest(appPayload, event) {
  return {
    PaymentId: appPayload.PaymentId,
    MerchantId: appPayload.MerchantId,
    WalletKey: event.payment.token.paymentData.data,
    EphemeralPublicKey: event.payment.token.paymentData.header.ephemeralPublicKey
  };
}
function getApplePayCancelRequest(appPayload) {
  return { PaymentId: appPayload.PaymentId };
}
function isBillingContactValid(billingContact) {
  if (!billingContact || typeof billingContact !== "object") return false;
  const c = billingContact;
  return Boolean(
    Array.isArray(c.addressLines) && c.addressLines[0] && c.postalCode && c.locality && c.subLocality && c.administrativeArea
  );
}
function isShippingContactValid(shippingContact) {
  if (!shippingContact || typeof shippingContact !== "object") return false;
  const c = shippingContact;
  return Boolean(c.givenName && c.emailAddress && c.phoneNumber);
}

// src/orchestrator.ts
function createApplePayOrchestrator(deps) {
  async function start() {
    if (!deps.client.canMakePayments()) {
      throw new Error("Apple Pay is not available on this device.");
    }
    const prepared = await deps.transactions.prepareTransaction();
    const parsedPayload = deps.parsePayload(prepared.appPayloadRaw);
    const sessionResponse = await deps.connector.openMerchantSession(parsedPayload);
    const fullPayload = deps.parsePayload(sessionResponse.Response);
    const request = getApplePayBaseRequest(
      { ...parsedPayload, Amount: fullPayload.Amount },
      deps.requestConfig
    );
    const session = deps.client.createSession(request, {
      onValidateMerchant: async () => {
        session.completeMerchantValidation(fullPayload.AppleSessionResponse);
      },
      onPaymentAuthorized: async (event) => {
        try {
          if (!isBillingContactValid(event.payment.billingContact)) {
            session.completePaymentFailure([
              { code: "billingContactInvalid", message: "Billing contact is incomplete." }
            ]);
            await deps.transactions.failTransaction(prepared.orderId);
            return;
          }
          if (!isShippingContactValid(event.payment.shippingContact)) {
            session.completePaymentFailure([
              { code: "shippingContactInvalid", message: "Shipping contact is incomplete." }
            ]);
            await deps.transactions.failTransaction(prepared.orderId);
            return;
          }
          const completeRequest = getApplePayCompleteRequest(fullPayload, event);
          await deps.connector.completePayment(fullPayload, completeRequest);
          await deps.transactions.finalizeTransaction(prepared.orderGroup);
          session.completePaymentSuccess();
          deps.onSuccess?.(prepared.orderGroup);
        } catch (error) {
          session.completePaymentFailure();
          await deps.transactions.failTransaction(prepared.orderId);
          deps.onError?.(error.message);
        }
      },
      onCancel: async () => {
        try {
          const cancelRequest = getApplePayCancelRequest(fullPayload);
          await deps.connector.cancelPayment(fullPayload, cancelRequest);
        } finally {
          await deps.transactions.failTransaction(prepared.orderId);
          deps.onCancel?.();
        }
      }
    });
    session.begin();
  }
  return { start };
}

// src/client.ts
function getApplePayConstructor() {
  const ctor = typeof window !== "undefined" ? window.ApplePaySession : void 0;
  if (!ctor) {
    throw new Error("Apple Pay unavailable in current browser environment.");
  }
  return ctor;
}
function createBrowserApplePayClient(version = 3) {
  return {
    canMakePayments() {
      try {
        const ApplePaySession = getApplePayConstructor();
        return ApplePaySession.canMakePayments();
      } catch {
        return false;
      }
    },
    createSession(request, handlers) {
      const ApplePaySession = getApplePayConstructor();
      const session = new ApplePaySession(version, request);
      session.onvalidatemerchant = () => {
        void handlers.onValidateMerchant();
      };
      session.onpaymentauthorized = (event) => {
        void handlers.onPaymentAuthorized(event);
      };
      session.oncancel = () => {
        void handlers.onCancel();
      };
      return {
        completeMerchantValidation(merchantSession) {
          session.completeMerchantValidation(merchantSession);
        },
        completePaymentSuccess() {
          session.completePayment({ status: ApplePaySession.STATUS_SUCCESS });
        },
        completePaymentFailure(errors) {
          session.completePayment({ status: ApplePaySession.STATUS_FAILURE, errors });
        },
        begin() {
          session.begin();
        }
      };
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createApplePayOrchestrator,
  createBrowserApplePayClient,
  getApplePayBaseRequest,
  getApplePayCancelRequest,
  getApplePayCompleteRequest,
  isBillingContactValid,
  isShippingContactValid
});
//# sourceMappingURL=index.cjs.map