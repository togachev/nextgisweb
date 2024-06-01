import { message } from "@nextgisweb/gui/antd";
export const useCopy = () => {

    const [messageApi, contextHolder] = message.useMessage();

    const messageInfo = (text) => {
        messageApi.open({
            type: 'info',
            content: text,
            duration: 2,
        });
    };

    const copyValue = async (value, text) => {
        if(navigator.clipboard) {
            await navigator.clipboard.writeText(value);
        }
        messageInfo(text);
    };

    return { copyValue, contextHolder };
};
