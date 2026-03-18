import Vapi from "@vapi-ai/web";

export class VapiManager {
    constructor() {
        this.publicKey = "2bd1acf3-d1eb-423e-9e31-23418fe111d4";
        this.assistantId = "25ef33ad-0459-4057-841f-ea222bdfa126";
        this.vapi = new Vapi(this.publicKey);
        this.isCallActive = false;
        this.volume = 0;
        this._initEvents();
    }

    _initEvents() {
        this.vapi.on('call-start', () => {
            this.isCallActive = true;
            console.log("Vapi Call Started");
        });

        this.vapi.on('call-end', () => {
            this.isCallActive = false;
            this.volume = 0;
            console.log("Vapi Call Ended");
        });

        this.vapi.on('volume-level', (vol) => {
            this.volume = vol;
        });

        this.vapi.on('error', (err) => {
            console.error("Vapi Error:", err);
        });
    }

    async startCall() {
        if (this.isCallActive) return;
        try {
            await this.vapi.start(this.assistantId);
        } catch (err) {
            console.error("Failed to start Vapi call:", err);
        }
    }

    stopCall() {
        if (!this.isCallActive) return;
        this.vapi.stop();
    }

    getVolume() {
        return this.volume;
    }
}
