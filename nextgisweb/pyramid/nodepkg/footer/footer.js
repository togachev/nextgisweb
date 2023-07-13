import "./footer.less";
import i18n from "@nextgisweb/pyramid/i18n";

export default function footer() {

    return (
        <>
            © {new Date().getFullYear()} {i18n.gettext("Yugorsky research Institute of information technologies")}
        </>
    );
}
