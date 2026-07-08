type ApplePayBillingContact = {
    addressLines?: string[];
    postalCode?: string;
    locality?: string;
    subLocality?: string;
    administrativeArea?: string;
};
type ApplePayShippingContact = {
    givenName?: string;
    emailAddress?: string;
    phoneNumber?: string;
};
type ApplePayPaymentEvent = {
    payment: {
        billingContact?: ApplePayBillingContact;
        shippingContact?: ApplePayShippingContact;
        token: ApplePayPaymentToken;
    };
};
type ApplePayPaymentToken = {
    paymentData: {
        data: string;
        header: {
            ephemeralPublicKey: string;
            publicKeyHash?: string;
            transactionId?: string;
        };
        signature?: string;
        version?: string;
    };
};
type ApplePayBaseRequest = {
    countryCode: string;
    currencyCode: string;
    merchantCapabilities: string[];
    supportedNetworks: string[];
    requiredBillingContactFields: string[];
    requiredShippingContactFields: string[];
    total: {
        label: string;
        type: 'final' | 'pending';
        amount: string;
    };
};
type ApplePayRequestConfig = {
    countryCode: string;
    currencyCode: string;
    merchantCapabilities: string[];
    supportedNetworks: string[];
    requiredBillingContactFields: string[];
    requiredShippingContactFields: string[];
    totalLabel: string;
    totalType: 'final' | 'pending';
};
type AppPayload = {
    MerchantId: string;
    ApiUrl: string;
    PaymentId: string;
    CertificateName?: string;
    OriginRequestId?: string;
    MerchantUrl?: string;
    Amount: string;
    AppleSessionResponse?: unknown;
    Response?: string;
};
type AppPayloadResponse = {
    Response: string;
};
type ApplePayCompleteRequest = {
    PaymentId: string;
    MerchantId: string;
    WalletKey: string;
    EphemeralPublicKey: string;
};
type ApplePayCancelRequest = {
    PaymentId: string;
};
type ApplePaySessionResponse = {
    Response: string;
};
type ApplePaySessionState = {
    appPayload: AppPayload;
    orderGroup: string;
};

type TransactionPrepared = {
    orderGroup: string;
    orderId?: string;
    appPayloadRaw: string;
};
interface TransactionGateway {
    prepareTransaction(): Promise<TransactionPrepared>;
    finalizeTransaction(orderGroup: string): Promise<void>;
    failTransaction(orderId?: string): Promise<void>;
}
interface ApplePayConnector {
    openMerchantSession(appPayload: AppPayload): Promise<ApplePaySessionResponse>;
    completePayment(appPayload: AppPayload, request: ApplePayCompleteRequest): Promise<unknown>;
    cancelPayment(appPayload: AppPayload, request: ApplePayCancelRequest): Promise<void>;
}
type ApplePaySessionHandlers = {
    onValidateMerchant: () => Promise<void>;
    onPaymentAuthorized: (event: ApplePayPaymentEvent) => Promise<void>;
    onCancel: () => Promise<void>;
};
interface ApplePaySessionController {
    completeMerchantValidation(merchantSession: unknown): void;
    completePaymentSuccess(): void;
    completePaymentFailure(errors?: unknown[]): void;
    begin(): void;
}
interface ApplePayClient {
    canMakePayments(): boolean;
    createSession(request: ApplePayBaseRequest, handlers: ApplePaySessionHandlers): ApplePaySessionController;
}

declare function getApplePayBaseRequest(appPayload: AppPayload, config?: Partial<ApplePayRequestConfig>): ApplePayBaseRequest;
declare function getApplePayCompleteRequest(appPayload: AppPayload, event: ApplePayPaymentEvent): ApplePayCompleteRequest;
declare function getApplePayCancelRequest(appPayload: AppPayload): ApplePayCancelRequest;
declare function isBillingContactValid(billingContact: unknown): boolean;
declare function isShippingContactValid(shippingContact: unknown): boolean;

type ApplePayOrchestratorDeps = {
    transactions: TransactionGateway;
    connector: ApplePayConnector;
    client: ApplePayClient;
    parsePayload: (raw: string) => AppPayload;
    requestConfig?: Partial<ApplePayRequestConfig>;
    onSuccess?: (orderGroup: string) => void;
    onError?: (message: string) => void;
    onCancel?: () => void;
};
declare function createApplePayOrchestrator(deps: ApplePayOrchestratorDeps): {
    start: () => Promise<void>;
};

declare function createBrowserApplePayClient(version?: number): ApplePayClient;

export { type AppPayload, type AppPayloadResponse, type ApplePayBaseRequest, type ApplePayBillingContact, type ApplePayCancelRequest, type ApplePayClient, type ApplePayCompleteRequest, type ApplePayConnector, type ApplePayOrchestratorDeps, type ApplePayPaymentEvent, type ApplePayPaymentToken, type ApplePayRequestConfig, type ApplePaySessionController, type ApplePaySessionHandlers, type ApplePaySessionResponse, type ApplePaySessionState, type ApplePayShippingContact, type TransactionGateway, type TransactionPrepared, createApplePayOrchestrator, createBrowserApplePayClient, getApplePayBaseRequest, getApplePayCancelRequest, getApplePayCompleteRequest, isBillingContactValid, isShippingContactValid };
