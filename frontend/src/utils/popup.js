import Swal from "sweetalert2";

const popup = Swal.mixin({
  width: 520,
  padding: "1.25rem 1.25rem 1rem",
  background: "#ffffff",
  color: "#0f172a",
  backdrop: "rgba(15, 23, 42, 0.42)",
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: "sumPopup",
    title: "sumPopupTitle",
    htmlContainer: "sumPopupText",
    actions: "sumPopupActions",
    confirmButton: "sumPopupBtn sumPopupBtnConfirm",
    cancelButton: "sumPopupBtn sumPopupBtnCancel",
    input: "sumPopupInput",
  },
  showClass: {
    popup: "sumPopupShow",
  },
  hideClass: {
    popup: "sumPopupHide",
  },
});

export const showSuccessPopup = (title, text = "") =>
  popup.fire({
    icon: "success",
    title,
    text,
  });

export const showErrorPopup = (title, text = "") =>
  popup.fire({
    icon: "error",
    title,
    text,
  });

export const showWarningPopup = (title, text = "") =>
  popup.fire({
    icon: "warning",
    title,
    text,
  });

export const confirmPopup = async ({
  title,
  text = "",
  confirmButtonText = "Yes",
  cancelButtonText = "Cancel",
  icon = "question",
}) => {
  const result = await popup.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });

  return result.isConfirmed;
};

export const promptPopup = async ({
  title,
  text = "",
  inputValue = "",
  inputPlaceholder = "",
  confirmButtonText = "Save",
  cancelButtonText = "Cancel",
}) => {
  const result = await popup.fire({
    title,
    text,
    input: "text",
    inputValue,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return "Please enter a value.";
      }
      return undefined;
    },
  });

  if (!result.isConfirmed) return null;
  return String(result.value || "").trim();
};
