
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import Modal from "../components/Modal";
import UIButton from "../components/UIButton";
import { useAuth } from "../hooks/useAtuh";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type ApiEnvelope<T> = {
    error: boolean;
    status: number;
    type: string;
    message: string;
    data: T;
};

const buildHeaders = (options: RequestInit, token?: string | null): HeadersInit => {
    const isForm = options.body instanceof FormData;
    return {
        // con FormData el navegador pone multipart/form-data + boundary
        ...(!isForm && { "Content-Type": "application/json" }),
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

type ApiContextType = {
    request: <T>(
        path: string,
        options?: RequestInit
    ) => Promise<T | null>;
    requestAuth: <T>(
        path: string,
        options?: RequestInit
    ) => Promise<T | null>;
    closeError: () => void;
    loading: boolean;
};

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {

    const { token } = useAuth();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const showModal = errorMessage !== null;

    const closeError = () => setErrorMessage(null);

    async function request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T | null> {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: buildHeaders(options),
            });

            const body = await response.json() as ApiEnvelope<T>;

            if (!response.ok || body.error) {
                setErrorMessage(
                    body.message || `Request failed (${response.status})`
                );
                return null;
            }

            return body.data;
        } catch {
            setErrorMessage(
                "Unable to connect to the server. Please try again."
            );
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function requestAuth<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T | null> {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: buildHeaders(options, token),
            });

            const body = await response.json() as ApiEnvelope<T>;

            if (!response.ok || body.error) {
                setErrorMessage(
                    body.message || `Request failed (${response.status})`
                );
                return null;
            }

            return body.data;
        } catch {
            setErrorMessage(
                "Unable to connect to the server. Please try again."
            );
            return null;
        } finally {
            setLoading(false);
        }
    }

    return (
        <ApiContext.Provider value={{ request, loading, requestAuth, closeError }}>
            {children}

            <Modal
                open={showModal}
                onClose={closeError}
                className="w-full md:max-w-xl h-auto"
                title="Request failed"
            >
                <div className="w-full p-3">
                    <h2 className="text-lg font-semibold text-red-400">
                        Request failed
                    </h2>

                    <p className="mt-3 text-sm mb-10">{errorMessage}</p>

                    <div className="flex justify-center">
                        <UIButton
                            type="button"
                            onClick={closeError}
                            className='px-10'
                        >
                            Close
                        </UIButton>
                    </div>
                </div>
            </Modal>
        </ApiContext.Provider>
    );
}

export function useApi() {
    const context = useContext(ApiContext);

    if (!context) {
        throw new Error("useApi must be used within an ApiProvider");
    }

    return context;
}
export default ApiContext