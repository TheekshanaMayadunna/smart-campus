import defaultLogo from "../../Assests/campus-velora-logo.svg";
import "./brandLogo.css";

export default function BrandLogo({
  className = "",
  src = defaultLogo,
  alt = "Campus Velora logo",
}) {
  return (
    <div className={`brandLogo ${className}`.trim()}>
      <div className="brandLogoMark" aria-hidden="true">
        <img src={src} alt={alt} className="brandLogoImg" />
      </div>
    </div>
  );
}

