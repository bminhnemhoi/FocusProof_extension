# Contributing to FocusProof

Cảm ơn bạn đã quan tâm đến FocusProof! 🎯

## Quy trình đóng góp

1. **Fork** repo và tạo branch mới từ `main`:
   ```bash
   git checkout -b feat/ten-tinh-nang
   ```
2. **Cài dependencies**:
   ```bash
   npm install
   ```
3. **Setup môi trường**:
   ```bash
   cp .env.example .env
   # Điền VITE_OPENAI_API_KEY (tuỳ chọn)
   ```
4. **Code & Test**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```
5. **Commit** theo Conventional Commits:
   - `feat:` tính năng mới
   - `fix:` sửa bug
   - `docs:` tài liệu
   - `test:` thêm/sửa test
   - `refactor:` refactor không đổi behavior
   - `chore:` cấu hình, CI, build
6. **Push** và mở **Pull Request** mô tả rõ thay đổi.

## Tiêu chuẩn code

- **TypeScript strict mode** — không dùng `any` trừ khi bắt buộc.
- **Test coverage** cho logic mới (Vitest).
- **Không commit secrets** — kiểm tra `.env` không bị track.
- **Lint sạch** — `npm run lint` phải pass.

## Báo lỗi

Mở [issue](../../issues/new) với:
- Mô tả bug và bước tái hiện
- Phiên bản Chrome / OS
- Console log / screenshot nếu có
