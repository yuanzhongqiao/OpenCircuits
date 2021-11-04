import {useEffect, useState} from "react";

import {Input} from "core/utils/Input";
import {Event} from "core/utils/Events";


export const useKeyDownEvent = (input: Input, key: number, f: () => void) => {
    useEffect(() => {
        if (!input)
            return;

        const LookForKey = (ev: Event) => {
            if (ev.type === "keydown" && ev.key === key) f();
        }

        input.addListener(LookForKey);

        return () => input.removeListener(LookForKey);
    }, [input, key, f]);
}

export const useWindowKeyDownEvent = (key: number, f: () => void) => {
    useEffect(() => {
        const LookForKey = (ev: KeyboardEvent) => {
            if (!(document.activeElement instanceof HTMLInputElement) && ev.keyCode === key)
                f();
        }

        window.addEventListener("keydown", LookForKey);

        return () => window.removeEventListener("keydown", LookForKey);
    }, [key, f]);
}

