export const OPEN_SERVICE_INQUIRY_EVENT = "ugc:open-service-inquiry";

export type OpenServiceInquiryEventDetail = {
  service?: string;
};

export const openServiceInquiryDialog = (detail?: OpenServiceInquiryEventDetail): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OpenServiceInquiryEventDetail>(OPEN_SERVICE_INQUIRY_EVENT, {
      detail,
    }),
  );
};
