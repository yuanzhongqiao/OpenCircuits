import React, {useState} from "react";

import {CreateAddGroupAction} from "core/actions/addition/AddGroupActionFactory";

import {Popup}   from "shared/components/Popup";

import {CloseHeaderPopups} from "shared/state/Header";
import {useSharedDispatch, useSharedSelector} from "shared/utils/hooks/useShared";

import {OrganizeMinDepth} from "core/utils/ComponentOrganizers";

import {GroupAction}             from "core/actions/GroupAction";
import {CreateDeselectAllAction,
        CreateGroupSelectAction,
        SelectAction,}            from "core/actions/selection/SelectAction";
import {PlaceAction}             from "core/actions/addition/PlaceAction";
import {CreateICDataAction}      from "digital/actions/CreateICDataAction";

import {DigitalCircuitInfo}     from "digital/utils/DigitalCircuitInfo";
import {DigitalComponent}       from "digital/models/DigitalComponent";
import {ICData}                 from "digital/models/ioobjects/other/ICData";
import {IC}                     from "digital/models/ioobjects/other/IC";
import {LED}                    from "digital/models/ioobjects/outputs/LED";
import {ConstantLow}            from "digital/models/ioobjects/inputs/ConstantLow";
import {ConstantHigh}           from "digital/models/ioobjects/inputs/ConstantHigh";
import {Button}                 from "digital/models/ioobjects/inputs/Button";
import {Switch}                 from "digital/models/ioobjects/inputs/Switch";
import {Clock}                  from "digital/models/ioobjects/inputs/Clock";
import {GenerateTokens,
        ExpressionToCircuit}    from "digital/utils/ExpressionParser";
import {FormatLabels, FormatMap}    from "digital/utils/ExpressionParserConstants";

import "./index.scss";

type Props = {
    mainInfo: DigitalCircuitInfo;
}

const Inputs = new Map<string, () => DigitalComponent>([
    ["Constant Low", () => new ConstantLow()],
    ["Constant High", () => new ConstantHigh()],
    ["Button", () => new Button()],
    ["Clock", () => new Clock()],
    ["Switch", () => new Switch()],
]);

function generate(info: DigitalCircuitInfo, expression: string,
                  isIC: boolean, input: string, format: string,
                  ops: Map<FormatLabels, string>=null) {
    if(ops === null)
        ops = FormatMap.get(format);
    const tokenList = GenerateTokens(expression, ops);
    const inputMap = new Map<string, DigitalComponent>();
    for(const token of tokenList) {
        if (token.type !== "input")
            continue;
        if (inputMap.has(token.name))
            continue;
        inputMap.set(token.name, Inputs.get(input).call(null));
        inputMap.get(token.name).setName(token.name);
    }
    const o = new LED();
    o.setName("Output");
    const circuit = ExpressionToCircuit(inputMap, expression, o, ops);
    // Get the location of the top left corner of the screen, the 1.5 acts as a modifier
    //  so that the components are not literally in the uppermost leftmost corner
    const startPos = info.camera.getPos().sub(info.camera.getCenter().scale(info.camera.getZoom()/1.5));
    OrganizeMinDepth(circuit, startPos);
    const action = new GroupAction([CreateDeselectAllAction(info.selections)]);
    if (isIC) {
        const data = new ICData(circuit);
        data.setName(expression);
        const ic = new IC(data);
        ic.setName(expression);
        ic.setPos(info.camera.getPos());
        action.add(new CreateICDataAction(data, info.designer));
        action.add(new PlaceAction(info.designer, ic));
        action.add(new SelectAction(info.selections, ic));
    }
    else {
        action.add(CreateAddGroupAction(info.designer, circuit));
        action.add(CreateGroupSelectAction(info.selections, circuit.getComponents()));
    }
    info.history.add(action.execute());
    info.renderer.render();
}

export const ExprToCircuitPopup = (() => {
    return ({ mainInfo }: Props) => {
        const {curPopup} = useSharedSelector(
            state => ({ curPopup: state.header.curPopup })
        );
        const dispatch = useSharedDispatch();

        const [expression, setExpression] = useState("");
        const [errorMessage, setErrorMessage] = useState("");
        const [isIC, setIsIC] = useState(false);
        const [input, setInput] = useState("Switch");
        const [format, setFormat] = useState("|");
        const [customOr, setCustomOr] = useState("|");
        const [customXor, setCustomXor] = useState("^");
        const [customAnd, setCustomAnd] = useState("&");
        const [customNot, setCustomNot] = useState("!");
        const [customParenOpen, setCustomParenOpen] = useState("(");
        const [customParenClose, setCustomParenClose] = useState(")");
        const [customSeparator, setCustomSeparator] = useState(" ");
    
        const inputTypes = Array.from(Inputs.keys()).map((input) =>
            <option key={input} value={input}>{input}</option>
        );
    
        const formats = Array.from(FormatMap.entries()).map((formatEntry) =>
            <div key={formatEntry[0]}>
                <input type="radio" id={formatEntry[0]} name="format" checked={format === formatEntry[0]} onChange={() => setFormat(formatEntry[0])} value={formatEntry[0]} />
                <label htmlFor={formatEntry[0]}>{formatEntry[1].get("label")}</label><br/>
            </div>
        );

        const customOps: [string, string, React.Dispatch<React.SetStateAction<string>>][] = [
            ["AND", customAnd, setCustomAnd],
            ["OR", customOr, setCustomOr],
            ["XOR", customXor, setCustomXor],
            ["NOT", customNot, setCustomNot],
            ["(", customParenOpen, setCustomParenOpen],
            [")", customParenClose, setCustomParenClose],
            ["Separator", customSeparator, setCustomSeparator],
        ];
        const customOpsInput = customOps.map((op) => 
            <div className="exprtocircuit__popup__customOps" key={op[0]}>
                <input title={"Enter symbol for " + op[0]} type="text" value={op[1]} onChange={e => op[2](e.target.value)}/>
                <label htmlFor={op[1]}>Custom {op[0]}: "{op[1]}"</label>
            </div>
        );
        

        return (
            <Popup title="Digital Expression To Circuit Generator"
                   isOpen={(curPopup === "expr_to_circuit")}
                   close={() => dispatch(CloseHeaderPopups())}>
                <div className="exprtocircuit__popup">
                    { errorMessage && <p className="exprtocircuit__popup__errorMessage">{"ERROR: " + errorMessage}</p> }
                    <input title="Enter Circuit Expression" type="text"
                               value={expression}
                               placeholder="!a | (B^third)"
                               onChange={e => setExpression(e.target.value)} />
                    <br/>

                    <div className="exprtocircuit__popup__settings">
                        <div>
                            <h3>Notation</h3>
                            {formats}
                            <div>
                                <input type="radio" name="format" checked={format === "custom"} onChange={() => setFormat("custom")} value={"custom"} />
                                <label htmlFor={"custom"}>Custom</label><br/>
                            </div>
                            {
                                format === "custom" &&
                                <div>
                                    {customOpsInput}
                                </div>
                            }
                        </div>

                        <div>
                            <h3>Options</h3>
                            <input onChange={() => setIsIC(!isIC)} checked={isIC} type="checkbox" id="isIC" name="isIC" />
                            <label htmlFor="isIC">Generate into IC</label>
                            <br/>
                            <br/>
                            <label>Input Component Type:  </label>
                            <select id="input"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onBlur={e => setInput(e.target.value)}>
                            {inputTypes}
                            </select>
                        </div>

                    </div>

                    <button className="exprtocircuit__popup__generate" type="button" disabled={expression===""} onClick={() => {
                        try {
                            if(format === "custom") {
                                const ops = new Map<FormatLabels, string>([
                                    ["|", customOr],
                                    ["^", customXor],
                                    ["&", customAnd],
                                    ["!", customNot],
                                    ["(", customParenOpen],
                                    [")", customParenClose],
                                    ["separator", customSeparator]
                                ]);
                                generate(mainInfo, expression, isIC, input, format, ops);
                            }
                            else
                                generate(mainInfo, expression, isIC, input, format);
                            setExpression("");
                            setErrorMessage("");
                            dispatch(CloseHeaderPopups());
                        }
                        catch (err) {
                            setErrorMessage(err.message);
                        }
                    }}>Generate</button>

                    <button className="cancel" type="button" onClick={() => {
                        setExpression("");
                        setErrorMessage("");
                        dispatch(CloseHeaderPopups());
                    }}>Cancel</button>

                </div>

            </Popup>
        );
    }
})();
