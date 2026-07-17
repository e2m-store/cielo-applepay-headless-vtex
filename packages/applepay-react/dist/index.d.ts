import { TransactionGateway, ApplePayConnector, ApplePayClient, AppPayload, ApplePayRequestConfig, ApplePaySessionState } from '@conectores_cielo/cielo-applepay-headless-vtex-core';
import * as react from 'react';
import { ButtonHTMLAttributes } from 'react';

type UseApplePayParams = {
    transactions: TransactionGateway;
    connector: ApplePayConnector;
    client: ApplePayClient;
    parsePayload?: (raw: string) => AppPayload;
    requestConfig?: Partial<ApplePayRequestConfig>;
    onSuccess?: (orderGroup: string) => void;
    onError?: (message: string) => void;
    onCancel?: () => void;
};
declare function useApplePay(params: UseApplePayParams): {
    start: () => Promise<void>;
    loading: boolean;
    error: string | null;
};

type UseApplePaySdkParams = {
    scriptId?: string;
    sdkUrl?: string;
    getIsReady?: () => boolean;
    errorMessage?: string;
};
declare function useApplePaySdk({ scriptId, sdkUrl, getIsReady, errorMessage, }?: UseApplePaySdkParams): {
    sdkReady: boolean;
    sdkError: string | null;
};

type ApplePayButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    loading?: boolean;
    sdkScriptId?: string;
    sdkUrl?: string;
    sdkLoadingLabel?: string;
    sdkErrorLabel?: string;
};
declare function ApplePayButton({ loading, disabled, sdkScriptId, sdkUrl, sdkLoadingLabel, sdkErrorLabel, ...rest }: ApplePayButtonProps): react.JSX.Element;

type ApplePayModalProps = {
    sessionState: ApplePaySessionState;
    requestConfig?: Partial<ApplePayRequestConfig>;
    onSuccess: (orderGroup: string) => void;
    onError: (message: string) => void;
    onCancel: () => void;
};
declare function ApplePayModal({ sessionState, requestConfig, onSuccess, onError, onCancel, }: ApplePayModalProps): react.JSX.Element;

export { ApplePayButton, ApplePayModal, type UseApplePayParams, useApplePay, useApplePaySdk };
