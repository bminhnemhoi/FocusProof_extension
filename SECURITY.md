# Security Policy

## Báo cáo lỗ hổng bảo mật

Nếu bạn phát hiện lỗ hổng bảo mật, **vui lòng KHÔNG mở public issue**.

Thay vào đó, hãy gửi báo cáo riêng tư qua:
- GitHub Security Advisories: tab **Security** → **Report a vulnerability**
- Hoặc email maintainer (xem trong commit history)

Chúng tôi sẽ phản hồi trong vòng 7 ngày.

## Phạm vi

- Rò rỉ secrets (API key, token)
- XSS / injection trong popup, content script, offscreen
- Bypass quyền `host_permissions` của Manifest V3
- Lộ dữ liệu phiên tập trung của user

## Out of scope

- Vấn đề chỉ xảy ra khi user tự cài extension độc hại khác
- Social engineering
- DoS đối với chính máy của user

## Best practices cho contributor

- **Không commit `.env`** (đã có trong `.gitignore`).
- Dùng `.env.example` làm template.
- API key chỉ inject qua `import.meta.env.VITE_*` tại build time và được XOR-obfuscate runtime (xem `src/utils/api-key.ts`).
- Mọi xử lý dữ liệu cá nhân (camera, audio, browsing) phải **chạy local** — không gửi server ngoài trừ AI Analysis có opt-in.
