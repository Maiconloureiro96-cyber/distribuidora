declare class EvolutionApiService {
    private api;
    private instanceName;
    private apiKey;
    private baseUrl;
    constructor();
    createInstance(): Promise<any>;
    connectInstance(): Promise<any>;
    getInstanceStatus(): Promise<any>;
    sendTextMessage(to: string, message: string): Promise<any>;
    sendButtonMessage(to: string, message: string, buttons: any[]): Promise<any>;
    sendListMessage(to: string, title: string, description: string, sections: any[]): Promise<any>;
    markMessageAsRead(messageId: string): Promise<any>;
    getQRCode(): Promise<any>;
    logoutInstance(): Promise<any>;
    deleteInstance(): Promise<any>;
}
declare const _default: EvolutionApiService;
export default _default;
//# sourceMappingURL=evolutionApi.d.ts.map