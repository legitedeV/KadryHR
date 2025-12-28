/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module "*.svg" {
  import type React from "react";
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}
