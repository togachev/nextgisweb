import { message } from "@nextgisweb/gui/antd";
export const useCopy = () => {

    const [messageApi, contextHolder] = message.useMessage();

    const messageInfo = (text) => {
        messageApi.open({
            type: "success",
            content: text,
            duration: 2,
        });
    };

    const copyValue = async (value, text) => {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(value);
        } else {
            const input = document.createElement('textarea')
            input.value = value
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
        }
        messageInfo(text);
    };

    return { copyValue, contextHolder };
};
