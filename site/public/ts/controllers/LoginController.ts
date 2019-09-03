import $ from "jquery";

import ClientConfig = gapi.auth2.ClientConfig;

import {GetCookie} from "../utils/Cookies";
import {LoadDynamicScript} from "../utils/Script";

import {GoogleAuthState} from "../utils/auth/GoogleAuthState";
import {AuthState} from "../utils/auth/AuthState";
import {NoAuthState} from "../utils/auth/NoAuthState";
import {Ping} from "../utils/api/Ping";
import {CreateUserCircuit, QueryUserCircuits} from "../utils/api/Circuits";
import {MainDesignerController} from "./MainDesignerController";
import {Exporter} from "../utils/io/Exporter";
import {HeaderController} from "./HeaderController";
import {XMLReader} from "../utils/io/xml/XMLReader";
import {XMLNode} from "../utils/io/xml/XMLNode";
import {CircuitMetadataBuilder} from "../models/CircuitMetadata";
import {SideNavCircuitPreview} from "../views/SideNavCircuitPreview";
import {UserCircuitsListController} from "./UserCircuitsListController";

export const LoginController = (() => {
    const loginPopup = $("#login-popup");
    const overlay = $("#overlay");

    const loginHeaderContainer = $("#header-login-container");
    const loginHeaderButton = $("#header-signin-button");
    const logoutHeaderButton = $("#header-signout-button");

    const saveHeaderButton = $("#header-save-button");

    let isOpen = false;
    let disabled = false;

    let authState: AuthState = undefined;

    // Put authentication type meta-tags here (used to determine if an auth method is enabled)
    const noAuthMeta = $("#no_auth_enable");
    const googleAuthMeta = $("#google-signin-client_id");

    async function OnLogin(): Promise<void> {
        loginHeaderContainer.addClass("hide");
        saveHeaderButton.removeClass("hide");
        logoutHeaderButton.removeClass("hide");
        LoginController.Hide();

        await UserCircuitsListController.UpdateCircuits(authState);
    }

    function OnLogout(): void {
        authState = undefined;
        loginHeaderContainer.removeClass("hide");
        saveHeaderButton.addClass("hide");
        logoutHeaderButton.addClass("hide");

        UserCircuitsListController.ClearCircuits();
    }

    function OnLoginError(e: {error: string}): void {
        console.error(e);
    }

    async function SetAuthState(as: AuthState): Promise<void> {
        if (!authState) {
            authState = as;
            return;
        }
        console.error("Attempt to load multiple auth states!");
        await authState.logOut().then(() => authState = as);
    }

    async function OnGoogleLogin(_: gapi.auth2.GoogleUser): Promise<void> {
        await SetAuthState(new GoogleAuthState());
        OnLogin();
    }

    async function OnNoAuthLogin(username: string): Promise<void> {
        SetAuthState(new NoAuthState(username));
        await OnLogin();
    }

    function OnNoAuthSubmitted(): void {
        const username = $("#no-auth-user-input").val() as string;
        if (username === "") {
            alert("User Name must not be blank");
            return;
        }
        OnNoAuthLogin(username);
    }

    function Show(): void {
        loginPopup.removeClass("invisible");
        overlay.removeClass("invisible");
    }
    function Hide(): void {
        loginPopup.addClass("invisible");
        overlay.addClass("invisible");
    }

    return {
        Init: async function(): Promise<number> {
            isOpen = false;

            loginHeaderButton.click(() => LoginController.Show());
            overlay.click(() => LoginController.Hide());

            logoutHeaderButton.click(async () => {
                if (authState)
                    await authState.logOut();
                OnLogout();
            });

            saveHeaderButton.click(async () => {
                console.log(await Ping(authState));

                
                // console.log(root.getChildren());
                // const circuit = MainDesignerController.GetDesigner();
                // const data = Exporter.WriteCircuit(circuit, HeaderController.GetProjectName());
                // console.log(await CreateUserCircuit("no_auth", "bobby", data));
            });


            // Setup each auth method if they are loaded in the page
            if (googleAuthMeta.length > 0) {
                // Load GAPI script
                await LoadDynamicScript("https://apis.google.com/js/platform.js");

                // Render sign in button
                gapi.signin2.render("login-popup-google-signin", {
                    "scope": "profile email",
                    "width": 120,
                    "height": 36,
                    "longtitle": false,
                    "onsuccess": OnGoogleLogin,
                    "onfailure": OnLoginError
                });

                // Load 'auth2' from GAPI and then initialize w/ meta-data
                await new Promise<void>((resolve) => gapi.load("auth2", resolve));
                await gapi.auth2.init(new class implements ClientConfig {
                    // Written like this to make ESLint happy
                    public client_id?: string = googleAuthMeta[0].getAttribute("content");
                }).then(async (_) => {}); // Have to explicitly call .then
            }
            if (noAuthMeta.length > 0) {
                const username = GetCookie("no_auth_username");
                if (username)
                    OnNoAuthLogin(username);
                $("#no-auth-submit").click(OnNoAuthSubmitted);
            }

            return 1;
        },
        Show: function(): void {
            if (disabled)
                return;

            isOpen = true;
            Show();
        },
        Hide: function(): void {
            if (disabled)
                return;

            isOpen = false;
            Hide();
        },
        IsOpen: function(): boolean {
            return isOpen;
        },
        Enable: function(): void {
            disabled = false;
        },
        Disable: function(): void {
            disabled = true;
        }
    }

})();
