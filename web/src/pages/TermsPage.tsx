import { useMeta } from '../hooks/useMeta';
import { PolicyPage } from './PrivacyPage';

export default function TermsPage() {
  useMeta({
    title: 'Terms of Service',
    description:
      'Điều khoản dịch vụ FocusProof: tài khoản, hệ thống Credit, subscription Pro & Team, hành vi cấm, IP, miễn trừ trách nhiệm.',
    canonicalPath: '/terms',
  });
  return (
    <PolicyPage
      title="Terms of Service"
      effectiveDate="18/04/2026"
      intro="Bằng việc cài đặt và sử dụng FocusProof, bạn đồng ý với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ."
      sections={[
        {
          title: 'Tài khoản & Đăng ký',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Bạn phải ≥13 tuổi (hoặc tuổi tối thiểu theo luật quốc gia bạn).</li>
              <li>Mỗi email chỉ tạo được 1 tài khoản.</li>
              <li>Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động dưới account của mình.</li>
            </ul>
          ),
        },
        {
          title: 'Hệ thống Credit',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Credit miễn phí (signup, referral, streak) không quy đổi thành tiền mặt.</li>
              <li>Credit không hết hạn, nhưng bị xóa khi tài khoản bị khóa do vi phạm.</li>
              <li>Mua thêm Credit (nếu có) không hoàn lại trừ trường hợp lỗi hệ thống.</li>
            </ul>
          ),
        },
        {
          title: 'Subscription Pro & Team',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Auto-renew mỗi chu kỳ. Hủy bất cứ lúc nào trong Dashboard.</li>
              <li>Hoàn tiền 100% trong 14 ngày đầu nếu không hài lòng.</li>
              <li>License Pro dùng được trên tối đa 3 thiết bị. Dùng &gt;3 sẽ bị khóa license.</li>
              <li>Gói Team yêu cầu tối thiểu 5 ghế. Thay đổi số ghế có hiệu lực từ chu kỳ kế tiếp.</li>
            </ul>
          ),
        },
        {
          title: 'Hành vi cấm',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Reverse engineer, decompile, hoặc redistribute extension/source code.</li>
              <li>Tự động hóa session để farm Credit hoặc Streak (sẽ bị ban vĩnh viễn).</li>
              <li>Chia sẻ License Key vượt quá giới hạn thiết bị.</li>
              <li>Giả mạo, sửa đổi PDF Certificate hoặc QR Code.</li>
              <li>Dùng dịch vụ vào mục đích bất hợp pháp hoặc gây hại.</li>
            </ul>
          ),
        },
        {
          title: 'Sở hữu trí tuệ',
          body: (
            <p>
              FocusProof, logo, và toàn bộ source code thuộc sở hữu của FocusProof Team. Bạn được
              cấp quyền sử dụng phi độc quyền, không chuyển nhượng, có thể thu hồi.
            </p>
          ),
        },
        {
          title: 'Miễn trừ trách nhiệm',
          body: (
            <p>
              Dịch vụ được cung cấp "as is". Chúng tôi không chịu trách nhiệm cho các tổn thất gián
              tiếp phát sinh từ việc sử dụng (vd: mất việc do sếp không chấp nhận chứng chỉ). Mức bồi
              thường tối đa = số tiền bạn đã trả trong 12 tháng gần nhất.
            </p>
          ),
        },
        {
          title: 'Thay đổi điều khoản',
          body: (
            <p>
              Chúng tôi có thể cập nhật Terms. Thay đổi quan trọng sẽ thông báo qua email trước 30
              ngày. Tiếp tục sử dụng = đồng ý với phiên bản mới.
            </p>
          ),
        },
      ]}
    />
  );
}
