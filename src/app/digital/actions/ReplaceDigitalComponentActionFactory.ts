import {Create, GetIDFor} from "serialeazy";

import {SelectionsWrapper} from "core/utils/SelectionsWrapper";

import {GroupAction} from "core/actions/GroupAction";

import {ConnectionAction, DisconnectAction} from "core/actions/addition/ConnectionAction";
import {DeleteAction, PlaceAction}          from "core/actions/addition/PlaceAction";

import {CreateDeselectAllAction, CreateGroupSelectAction} from "core/actions/selection/SelectAction";

import {TranslateAction} from "core/actions/transform/TranslateAction";

import {InputPortChangeAction}  from "digital/actions/ports/InputPortChangeAction";
import {MuxPortChangeAction}    from "digital/actions/ports/MuxPortChangeAction";
import {OutputPortChangeAction} from "digital/actions/ports/OutputPortChangeAction";

import {DigitalComponent} from "digital/models";

import {IC, ICData, Multiplexer} from "digital/models/ioobjects";

import {Mux} from "digital/models/ioobjects/other/Mux";



/**
 * Returns a GroupAction for replacing the original component with a new one.
 * Replacement must be able to have at least as many input/output ports as original has in use.
 * Original must be placed in a designer.
 * This action implicitly executes on creation.
 *
 * @param original    The component to replace, already in designer.
 * @param replacement The new component's string representation or ICData.
 * @param selections  If supplied, deselects the current selection and selects replacement.
 * @returns             A GroupAction containing the actions required to replace the component and the new component.
 * @throws If original is not in a designer.
 * @throws If replacement is a string that does not represent a valid component.
 */
export function CreateReplaceDigitalComponentAction(original: DigitalComponent,
                                                    replacement: string | ICData,
                                                    selections?: SelectionsWrapper): [GroupAction, DigitalComponent] {
    console.log(`Replacing ${GetIDFor(original)} with ${replacement}`);
    const designer = original.getDesigner();
    if (!designer) {
        throw new Error("original is not in a designer");
    }
    const replacementComponent = replacement instanceof ICData
                                 ? new IC(replacement)
                                 : Create<DigitalComponent>(replacement);
    if (!replacementComponent)
        throw new Error(`Supplied replacement id "${replacement}" is invalid`);
    const action = new GroupAction([], "Replace Digital Component",
                                   [`Replacing "${original.getName()}" with a(n) "${replacement instanceof ICData
                                                                                    ? replacement.getName()
                                                                                    : replacement}"`]);
    const origInputs = original.getInputPorts();
    const origOutputs = original.getOutputPorts();

    if (selections)
        action.add(CreateDeselectAllAction(selections));
    action.add(new PlaceAction(designer, replacementComponent));
    if (selections)
        action.add(CreateGroupSelectAction(selections, [replacementComponent]));

    if (replacementComponent instanceof Mux) {
        const numSelectOrig = original instanceof Mux ? original.getSelectPortCount().getValue() : 0;
        const numSelectRequired = Math.ceil(Math.sqrt((replacementComponent instanceof Multiplexer
                                                       ? origInputs : origOutputs).length))
        action.add(new MuxPortChangeAction(replacementComponent,
                                           replacementComponent.getSelectPortCount().getValue(),
                                           Math.max(numSelectOrig, numSelectRequired)));
    } else if (!(replacementComponent instanceof IC)) {
        action.add(new InputPortChangeAction(replacementComponent,
                                             replacementComponent.getInputPortCount().getValue(),
                                             origInputs.length));
        action.add(new OutputPortChangeAction(replacementComponent,
                                             replacementComponent.getOutputPortCount().getValue(),
                                             origOutputs.length));
    }

    const repInputs = replacementComponent.getInputPorts();
    const repOutputs = replacementComponent.getOutputPorts();

    origInputs.forEach((port, index) => {
        [...port.getWires()].forEach(wire => {
            const otherPort = wire.getInput();
            action.add(new DisconnectAction(designer, wire));
            action.add(new ConnectionAction(designer, repInputs[index], otherPort));
        });
    });
    origOutputs.forEach((port, index) => {
        [...port.getWires()].forEach(wire => {
            const otherPort = wire.getOutput();
            action.add(new DisconnectAction(designer, wire));
            action.add(new ConnectionAction(designer, repOutputs[index], otherPort));
        });
    });

    action.add(new TranslateAction([replacementComponent],
                                   [replacementComponent.getPos()],
                                   [original.getPos()]));
    action.add(new DeleteAction(designer, original));

    return [action, replacementComponent];
}
