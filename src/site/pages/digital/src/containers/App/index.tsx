import {useCallback} from "react";

import {CircuitMetadataBuilder} from "core/models/CircuitMetadata";

import {DigitalCircuitInfo} from "digital/utils/DigitalCircuitInfo";

import {CircuitInfoHelpers} from "shared/utils/CircuitInfoHelpers";

import {useWindowSize} from "shared/utils/hooks/useWindowSize";

import {ContextMenu}               from "shared/containers/ContextMenu";
import {HistoryBox}                from "shared/containers/HistoryBox";
import {ImageExporterPopup,
        ImageExporterPreviewProps} from "shared/containers/ImageExporterPopup";
import {LoginPopup}     from "shared/containers/LoginPopup";
import {SelectionPopup} from "shared/containers/SelectionPopup";
import {SideNav}        from "shared/containers/SideNav";

import {PositionModule} from "shared/containers/SelectionPopup/modules/PositionModule";
import {PropertyModule} from "shared/containers/SelectionPopup/modules/PropertyModule";

import {DigitalPaste} from "site/digital/utils/DigitalPaste";

import {DigitalHeader}          from "site/digital/containers/DigitalHeader";
import {DigitalItemNav}         from "site/digital/containers/DigitalItemNav";
import {ExprToCircuitPopup}     from "site/digital/containers/ExprToCircuitPopup";
import {ICDesigner}             from "site/digital/containers/ICDesigner";
import {ICViewer}               from "site/digital/containers/ICViewer";
import {ImageExporterPreview}   from "site/digital/containers/ImageExporterPreview";
import {KeyboardShortcutsPopup} from "site/digital/containers/KeyboardShortcutsPopup";
import {MainDesigner}           from "site/digital/containers/MainDesigner";
import {QuickStartPopup}        from "site/digital/containers/QuickStartPopup";

import {BusButtonModule}            from "site/digital/containers/SelectionPopup/modules/BusButtonModule";
import {ClockSyncButtonModule}      from "site/digital/containers/SelectionPopup/modules/ClockSyncButtonModule";
import {ColorModule}                from "site/digital/containers/SelectionPopup/modules/ColorModule";
import {ComparatorInputCountModule} from "site/digital/containers/SelectionPopup/modules/ComparatorInputCountModule";
import {ConstantNumberInputModule}  from "site/digital/containers/SelectionPopup/modules/ConstantNumberInputModule";
import {CreateICButtonModule}       from "site/digital/containers/SelectionPopup/modules/CreateICButtonModule";
import {DecoderInputCountModule}    from "site/digital/containers/SelectionPopup/modules/DecoderInputCountModule";
import {FrequencyModule}            from "site/digital/containers/SelectionPopup/modules/FrequencyModule";
import {InputCountModule}           from "site/digital/containers/SelectionPopup/modules/InputCountModule";
import {OscilloscopeModule}         from "site/digital/containers/SelectionPopup/modules/OscilloscopeModules";
import {OutputCountModule}          from "site/digital/containers/SelectionPopup/modules/OutputCountModule";
import {SegmentCountModule}         from "site/digital/containers/SelectionPopup/modules/SegmentCountModule";
import {SelectPortCountModule}      from "site/digital/containers/SelectionPopup/modules/SelectPortCountModule";
import {TextColorModule}            from "site/digital/containers/SelectionPopup/modules/TextColorModule";
import {ViewICButtonModule}         from "site/digital/containers/SelectionPopup/modules/ViewICButtonModule";

import docsConfig    from "site/digital/data/docsUrlConfig.json";
import exampleConfig from "site/digital/data/examples.json";

import {PauseResumeButtonModule} from "../SelectionPopup/modules/PauseResumeButtonModules";

import "./index.scss";


const exampleCircuits = exampleConfig.examples.map((example) =>
    new CircuitMetadataBuilder()
        .withId(example.file)
        .withName(example.name)
        .withOwner("Example")
        .withDesc("Example Circuit")
        .withThumbnail(example.thumbnail)
        .build()
);

type Props = {
    info: DigitalCircuitInfo;
    helpers: CircuitInfoHelpers;
    canvas: React.RefObject<HTMLCanvasElement>;
}

export const App = ({ info, helpers, canvas }: Props) => {
    const { h } = useWindowSize();

    // Memoize for eslint(react/no-unstable-nested-components)
    const imageExporterPreview = useCallback((props: ImageExporterPreviewProps) => (
        <ImageExporterPreview mainInfo={info} {...props} />
    ), [info]);

    return (
        <div className="App">
            <SideNav helpers={helpers}
                     exampleCircuits={exampleCircuits} />

            <div className="App__container" style={{ height: h+"px" }}>
                <DigitalHeader img="img/icons/logo.svg"
                               helpers={helpers}
                               info={info} />

                <main>
                    <MainDesigner info={info} canvas={canvas} />

                    <DigitalItemNav info={info} />
                    <HistoryBox info={info} />

                    <SelectionPopup info={info}
                                    docsUrlConfig={docsConfig}>
                        <PositionModule info={info} />
                        <PropertyModule info={info} />
                        <InputCountModule info={info} />
                        <ComparatorInputCountModule info={info} />
                        <SelectPortCountModule info={info} />
                        <ConstantNumberInputModule info={info} />
                        <DecoderInputCountModule info={info} />
                        <OutputCountModule info={info} />
                        <SegmentCountModule info={info} />
                        <OscilloscopeModule info={info} />
                        <FrequencyModule info={info} />
                        <PauseResumeButtonModule info={info} />
                        <ClockSyncButtonModule info={info} />
                        <ColorModule info={info} />
                        <TextColorModule info={info} />
                        <BusButtonModule info={info} />
                        <CreateICButtonModule info={info} />
                        <ViewICButtonModule info={info} />
                    </SelectionPopup>

                    <ContextMenu info={info}
                                 paste={(data, menuPos) => DigitalPaste(data, info, menuPos)} />
                </main>
            </div>

            <ICDesigner mainInfo={info} />
            <ICViewer mainInfo={info} />

            <QuickStartPopup />
            <KeyboardShortcutsPopup />
            <ImageExporterPopup preview={imageExporterPreview} />

            <ExprToCircuitPopup mainInfo={info} />

            <LoginPopup />
        </div>
    );
};
