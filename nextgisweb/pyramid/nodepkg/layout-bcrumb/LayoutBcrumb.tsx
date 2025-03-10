import "./LayoutBcrumb.less";

interface LayoutBcrumbProps {
    bcpath?: string;
}

export const LayoutBcrumb = ({ bcpath }: LayoutBcrumbProps) => {
    console.log(bcpath);
    
//     %if len(bcpath) > 0:
//     <div class="ngw-pyramid-layout-bcrumb">
//         %for idx, bc in enumerate(bcpath):
//             <span>
//                 <a href="${bc.link}">
//                     %if bc.icon:
//                         ${icon_svg(bc.icon)}
//                     %endif
//                     %if bc.label:
//                         ${tr(bc.label)}
//                     %endif
//                 </a>
//             </span>
//         %endfor
//     </div>
// %endif


    // return (
    //     <div className="title-resource-component">
    //         <div className="title-resource" title={title} >{title}</div>
    //     </div>
    // );
};

LayoutBcrumb.displayName = "LayoutBcrumb";