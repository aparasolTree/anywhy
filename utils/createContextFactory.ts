import { createContext, createElement, Provider } from "preact";
import { useContext } from "preact/hooks";

export function createContextFactory<T>() {
    const FactoryContext = createContext<T | null>(null);
    const ProviderFactory: Provider<T> = (props) => {
        return createElement(FactoryContext.Provider, props);
    };

    function useFactoryContext<D = T>() {
        const context = useContext(FactoryContext);
        if (!context) {
            throw new Error(
                "useFactofyContext must be used within ProviderFactory",
            );
        }
        return context as D;
    }

    return [useFactoryContext, ProviderFactory] as const;
}
