import {GroupAction} from "core/actions/GroupAction";

import {GetInvertedGate} from "digital/utils/ComponentUtils";

import {CreateReplaceDigitalComponentAction} from "digital/actions/ReplaceDigitalComponentActionFactory";

import {DigitalCircuitDesigner} from "digital/models";

import {DigitalObjectSet}         from "digital/models/DigitalObjectSet";
import {ANDGate, ORGate, XORGate} from "digital/models/ioobjects";

import {NOTGate} from "digital/models/ioobjects/gates/BUFGate";

import {CreateSnipGateAction} from "../SnipGateActionFactory";


/**
 * This action replaces ANDGates, ORGates, and XORGates followed by only a NOTGate with
 *  NANDGates, NORGates, and XNORGates respectively. This action is implicitly executed on creation.
 *
 * @param designer The designer in which the action is taking place.
 * @param circuit  The circuit to modify, must be placed in designer.
 * @returns          The action to create the negated circuit and the negated circuit.
 */
export function CreateNegatedGatesAction(designer: DigitalCircuitDesigner,
                                         circuit: DigitalObjectSet): [GroupAction, DigitalObjectSet] {
    const action = new GroupAction([], "Create Negated Gates Action");
    const negatedCircuit = [...circuit.toList()];

    const gates = circuit.getOthers().filter(gate =>
        (gate instanceof ANDGate || gate instanceof ORGate || gate instanceof XORGate)
    ) as Array<ANDGate | ORGate | XORGate>;

    gates.forEach(gate => {
        const wires = gate.getOutputPort(0).getWires();
        if (wires.length === 1) {
            const other = wires[0].getOutputComponent();
            if (other instanceof NOTGate) {
                const newGate = GetInvertedGate(gate);

                // Remove wires and gates from negatedCircuit
                gate.getInputs().forEach(wire => negatedCircuit.splice(negatedCircuit.indexOf(wire), 1));
                negatedCircuit.splice(negatedCircuit.indexOf(wires[0]), 1);
                other.getOutputs().forEach(wire => negatedCircuit.splice(negatedCircuit.indexOf(wire), 1));
                negatedCircuit.splice(negatedCircuit.indexOf(other), 1);

                // Swap out the gates
                action.add(CreateSnipGateAction(other));
                const [replaceAction, replacementComponent] = CreateReplaceDigitalComponentAction(gate, newGate)
                action.add(replaceAction.execute());

                // Add new wires to negatedCircuit
                negatedCircuit.splice(negatedCircuit.indexOf(gate), 1, replacementComponent);
                replacementComponent.getInputs().forEach(wire => negatedCircuit.push(wire));
                replacementComponent.getOutputs().forEach(wire => negatedCircuit.push(wire));
            }
        }
    });

    return [action, DigitalObjectSet.From(negatedCircuit)];
}
