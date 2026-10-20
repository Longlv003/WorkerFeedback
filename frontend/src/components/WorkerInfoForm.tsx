import { WorkerFieldsConfig, WorkerInfo } from "@worker-feedback/shared";
import React, { useState } from "react";

interface Props {
  fieldsConfig: WorkerFieldsConfig;
  initialData: WorkerInfo | null;
  onContinue: (info: WorkerInfo) => void;
}

export const WorkerInfoForm: React.FC<Props> = ({
  fieldsConfig,
  initialData,
  onContinue,
}) => {
  const [workerId, setWorkerId] = useState(initialData?.workerId || "");
  const [name, setName] = useState(initialData?.name || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [workLocation, setWorkLocation] = useState(
    initialData?.workLocation || "",
  );
  const [anonymous, setAnonymous] = useState<boolean>(
    initialData?.anonymous || false,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!workerId.trim()) newErrors.workerId = "Vui lòng nhập ID";
    if (!name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!department) newErrors.department = "Vui lòng chọn bộ phận";
    if (!workLocation) newErrors.workLocation = "Vui lòng chọn vị trí làm việc";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onContinue({
      workerId: workerId.trim(),
      name: name.trim(),
      department,
      workLocation,
      anonymous: false,
    });
  };

  return (
    <div>
      <div className="app-header-banner">
        <div className="banner-label">SEI Worker Feedback</div>
        <h1>
          Khảo Sát Ý Kiến
          <br />
          Người Lao Động
        </h1>
        <p>
          Ý kiến của bạn giúp cải thiện môi trường làm việc ngày càng tốt hơn
        </p>
      </div>

      <div className="step-dots">
        <div className="step-dot active"></div>
        <div className="step-dot"></div>
        <div className="step-dot"></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-icon">
            <img src="/icons/user.svg" alt="" width="22" height="22" />
          </div>
          <div className="card-header-text">
            <h2>Thông tin người tham gia</h2>
            <p>Điền đầy đủ để tiếp tục khảo sát</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="workerId">
              ID (Mã nhân viên)<span className="required-asterisk">*</span>
            </label>
            <input
              id="workerId"
              type="text"
              inputMode="numeric"
              className={`form-control ${errors.workerId ? "has-error" : ""}`}
              placeholder="Nhập mã nhân viên..."
              value={workerId}
              onChange={(e) => {
                setWorkerId(e.target.value);
                if (errors.workerId) setErrors((p) => ({ ...p, workerId: "" }));
              }}
            />
            {errors.workerId && (
              <div className="error-text">
                <img src="/icons/alert.svg" alt="" width="14" height="14" />{" "}
                {errors.workerId}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Họ và tên<span className="required-asterisk">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`form-control ${errors.name ? "has-error" : ""}`}
              placeholder="Nhập họ và tên đầy đủ..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: "" }));
              }}
            />
            {errors.name && (
              <div className="error-text">
                <img src="/icons/alert.svg" alt="" width="14" height="14" />{" "}
                {errors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="department">
              Bộ phận / Công đoạn<span className="required-asterisk">*</span>
            </label>
            <select
              id="department"
              className={`form-control ${errors.department ? "has-error" : ""}`}
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                if (errors.department)
                  setErrors((p) => ({ ...p, department: "" }));
              }}
            >
              <option value="">-- Chọn bộ phận --</option>
              {fieldsConfig.departments.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {errors.department && (
              <div className="error-text">
                <img src="/icons/alert.svg" alt="" width="14" height="14" />{" "}
                {errors.department}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="workLocation">
              Vị trí làm việc<span className="required-asterisk">*</span>
            </label>
            <select
              id="workLocation"
              className={`form-control ${errors.workLocation ? "has-error" : ""}`}
              value={workLocation}
              onChange={(e) => {
                setWorkLocation(e.target.value);
                if (errors.workLocation)
                  setErrors((p) => ({ ...p, workLocation: "" }));
              }}
            >
              <option value="">-- Chọn vị trí --</option>
              {fieldsConfig.workLocations.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {errors.workLocation && (
              <div className="error-text">
                <img src="/icons/alert.svg" alt="" width="14" height="14" />{" "}
                {errors.workLocation}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Ẩn danh thông tin?</label>
            <div className="radio-group-horizontal">
              <label className={`radio-pill ${!anonymous ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="anonymous"
                  checked={!anonymous}
                  onChange={() => setAnonymous(false)}
                />
                Không ẩn danh
              </label>
              <label className={`radio-pill ${anonymous ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="anonymous"
                  checked={anonymous}
                  onChange={() => setAnonymous(true)}
                />
                <img
                  src="/icons/shield.svg"
                  alt=""
                  width="14"
                  height="14"
                  style={{ opacity: 0.7 }}
                />
                Ẩn danh
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: "8px" }}
          >
            Tiếp tục
          </button>
        </form>
      </div>
    </div>
  );
};
