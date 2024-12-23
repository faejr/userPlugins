import "./style.css";

import { addAccessory, removeAccessory } from "@api/MessageAccessories";
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Link } from "@components/Link";
import { Devs } from "@utils/constants";
import definePlugin, { PluginNative } from "@utils/types";
import { useEffect, useState } from "@webpack/common";

const Native = VencordNative.pluginHelpers.SpotifyToAppleMusic as PluginNative<typeof import("./native")>;

const settings = definePluginSettings({});

function MessageEmbedAccessory({ spotifyUrl }: { spotifyUrl: string; }) {
    const [remoteData, setRemoteData] = useState(null);

    useEffect(() => {
        async function getRemoteData() {
            const data = await Native.fetchRemoteData(spotifyUrl);
            setRemoteData(data);
        }
        if (!remoteData) {
            getRemoteData();
        }
    }, []);

    if (!remoteData) {
        return <div>Fetching...</div>;
    }

    return (<div>
        <Link
            href={remoteData.appleMusicLink}
            target="_blank"
            onClick={e => {
                if (Vencord.Plugins.isPluginEnabled("OpenInApp")) {
                    const OpenInApp = Vencord.Plugins.plugins.OpenInApp as any as typeof import("../../plugins/openInApp").default;
                    // handleLink will .preventDefault() if applicable
                    OpenInApp.handleLink(e.currentTarget, e);
                }
            }}
            className="vc-listen-on-apple-music"
        >
            <img alt="Listen on Apple music" height="30" src="https://gist.githubusercontent.com/faejr/b911b658d2678ed408cc6528318deb67/raw/a03fbf2435c2d70a549feb8f423bc1f7c6d515a0/listen_on_apple_badge.svg" />
        </Link>
    </div>
    );
}

const messageLinkRegex = /(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/gi;

export default definePlugin({
    name: "SpotifyToAppleMusic",
    authors: [Devs.faejr],
    description: "Turns spotify links into apple music links",
    settings,
    dependencies: ["MessageAccessoriesAPI", "MessageUpdaterAPI", "UserSettingsAPI"],

    start() {
        addAccessory("messageLinkEmbed", props => {
            if (!messageLinkRegex.test(props.message.content))
                return null;

            // need to reset the regex because it's global
            messageLinkRegex.lastIndex = 0;

            const spotifyUrl = props.message.content.match(messageLinkRegex)[0];

            return (
                <ErrorBoundary>
                    <MessageEmbedAccessory
                        spotifyUrl={spotifyUrl}
                    />
                </ErrorBoundary>
            );
        });
    },

    stop() {
        removeAccessory("messageLinkEmbed");
    }
});
