import { AppPayload, ApplePaySessionResponse, getApplePayCancelRequest, ApplePayRequestConfig, ApplePayCompleteRequest, ApplePayCancelRequest, TransactionPrepared, ApplePayConnector, TransactionGateway } from '@cielo/applepay-headless-vtex';

type PreparedApplePayOrder = {
    orderReference: string;
    orderId?: string;
};
type ProcessPlacedOrderApp = {
    appName: string;
    appPayload?: string;
};
type ProcessPlacedOrderResult = {
    apps?: ProcessPlacedOrderApp[];
};
type StartVtexApplePayFlowDeps = {
    /**
     * Deve concluir toda a criacao do pedido e o registro do pagamento no gateway
     * (ex: attachments VTEX + POST no paymentsUrl) antes de resolver, retornando
     * apenas as referencias necessarias para o restante do fluxo Apple Pay.
     */
    prepareOrder: () => Promise<PreparedApplePayOrder>;
    processPlacedOrder: (orderReference: string) => Promise<ProcessPlacedOrderResult | undefined>;
    cancelOrder: (orderId: string) => Promise<boolean>;
    /**
     * Valor total do pedido como string decimal (ex: "99.90").
     * Necessário para criar a ApplePaySession sincronamente no handler de gesto do usuário,
     * antes de qualquer operação assíncrona, conforme exigência do iOS Safari.
     */
    initialAmount: string;
    onSuccess: (orderReference: string) => void;
    onError: (message: string) => void;
};
type ClientOpenSessionFn = (payload: AppPayload) => Promise<ApplePaySessionResponse>;
type ClientCancelFn = (appPayload: AppPayload, cancelRequest: ReturnType<typeof getApplePayCancelRequest>) => Promise<void>;
type CieloApplePaySetupOptions = {
    clientOpenSession?: ClientOpenSessionFn;
    clientCancel?: ClientCancelFn;
    ClientRequestConfig?: Partial<ApplePayRequestConfig>;
    strictDeviceValidation?: boolean;
};
declare function CieloApplePaySetup(): {
    Init: (options?: CieloApplePaySetupOptions) => void;
    startVtexApplePayFlow: (deps: StartVtexApplePayFlowDeps) => Promise<void>;
};
declare const Init: (options?: CieloApplePaySetupOptions) => void;
declare const startVtexApplePayFlow: (deps: StartVtexApplePayFlowDeps) => Promise<void>;

type VtexTransactionsDeps = {
    prepare: () => Promise<TransactionPrepared>;
    finalize: (orderGroup: string) => Promise<void>;
    fail: (orderId?: string) => Promise<void>;
};
declare function createVtexTransactionGateway(deps: VtexTransactionsDeps): TransactionGateway;
type VtexConnectorDeps = {
    session: (appPayload: AppPayload) => Promise<ApplePaySessionResponse>;
    complete: (appPayload: AppPayload, request: ApplePayCompleteRequest) => Promise<unknown>;
    cancel: (appPayload: AppPayload, request: ApplePayCancelRequest) => Promise<void>;
};
declare function createVtexApplePayConnector(deps: VtexConnectorDeps): ApplePayConnector;
declare function postCielo<T>(path: string, body: unknown, apiUrl: string, merchantId?: string): Promise<T>;
declare function requestApplePaySession(appPayload: AppPayload): Promise<ApplePaySessionResponse>;
declare function requestApplePayComplete(appPayload: AppPayload, walletRequest: ApplePayCompleteRequest): Promise<ApplePaySessionResponse>;
declare function requestApplePayCancel(appPayload: AppPayload, cancelRequest: ApplePayCancelRequest): Promise<void>;

export { CieloApplePaySetup, type CieloApplePaySetupOptions, type ClientCancelFn, type ClientOpenSessionFn, Init, type StartVtexApplePayFlowDeps, type VtexConnectorDeps, type VtexTransactionsDeps, createVtexApplePayConnector, createVtexTransactionGateway, postCielo, requestApplePayCancel, requestApplePayComplete, requestApplePaySession, startVtexApplePayFlow };
