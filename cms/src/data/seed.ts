export interface SeedLesson {
  name: string;
}

export interface SeedChapter {
  name: string;
  lessons: SeedLesson[];
}

export const SEED_CHAPTERS: SeedChapter[] = [
  {
    name: 'Bảng chữ cái tiếng Nhật',
    lessons: [
      { name: 'Bảng chữ mềm' },
      { name: 'Bảng chữ cứng' },
      { name: 'Trường âm' },
      { name: 'Âm ん' },
      { name: 'Âm ngắt' },
    ],
  },
  {
    name: 'Con người',
    lessons: [
      { name: 'Cơ thể' },
      { name: 'Gia đình' },
      { name: 'Nhân sinh' },
      { name: 'Tình yêu và hôn nhân' },
      { name: 'Sinh hoạt thường ngày' },
      { name: 'Hiện tượng sinh lí' },
      { name: 'Ngoại hình' },
      { name: 'Tính cách - thái độ' },
      { name: 'Tình cảm' },
    ],
  },
  {
    name: 'Nhà',
    lessons: [
      { name: 'Bất động sản' },
      { name: 'Bên ngoài nhà' },
      { name: 'Phòng khách' },
      { name: 'Bếp' },
      { name: 'Phòng tắm' },
      { name: 'Phòng ngủ' },
      { name: 'Phòng trẻ con' },
      { name: 'Công cụ - tạp hóa' },
    ],
  },
  {
    name: 'Số',
    lessons: [
      { name: 'Chữ số' },
      { name: 'Tính toán' },
      { name: 'Hình họa' },
      { name: 'Thời gian' },
    ],
  },
  {
    name: 'Đô thị',
    lessons: [
      { name: 'Đô thị' },
      { name: 'Bưu điện' },
      { name: 'Hiệu thuốc - bệnh viện' },
      { name: 'Sức khỏe - bệnh tật' },
      { name: 'Ngân hàng' },
      { name: 'Đồ ăn nhanh' },
      { name: 'Nhà hàng' },
      { name: 'Món ăn' },
      { name: 'Quán rượu' },
      { name: 'Khách sạn' },
      { name: 'Tiệm cắt tóc' },
      { name: 'Trung tâm chăm sóc khách hàng - trung tâm sửa chữa' },
      { name: 'Đồn cảnh sát' },
    ],
  },
  {
    name: 'Giáo dục - Văn hóa - Xã hội',
    lessons: [
      { name: 'Trường học' },
      { name: 'Thư viện' },
      { name: 'Tôn giáo' },
      { name: 'Kinh tế' },
      { name: 'Xã hội - chính trị' },
      { name: 'Sự cố - tai nạn' },
      { name: 'Lịch sử' },
      { name: 'Luật pháp' },
    ],
  },
  {
    name: 'Giao thông',
    lessons: [
      { name: 'Phương tiện giao thông' },
      { name: 'Xe đạp' },
      { name: 'Xe máy' },
      { name: 'Xe ô tô' },
      { name: 'Đường' },
      { name: 'Tàu điện' },
      { name: 'Cảng biển' },
      { name: 'Máy bay' },
    ],
  },
  {
    name: 'Công việc',
    lessons: [
      { name: 'Nghề nghiệp' },
      { name: 'Chức vụ' },
      { name: 'Công việc' },
      { name: 'Văn phòng' },
      { name: 'Máy tính - internet' },
    ],
  },
  {
    name: 'Mua sắm',
    lessons: [
      { name: 'Trung tâm thương mại' },
      { name: 'Thực phẩm' },
      { name: 'Trang phục nam' },
      { name: 'Trang phục nữ' },
      { name: 'Giày - các thứ khác' },
      { name: 'Mỹ phẩm' },
      { name: 'Đồ điện gia dụng' },
    ],
  },
  {
    name: 'Thể thao - Sở thích',
    lessons: [
      { name: 'Thể thao' },
      { name: 'Bể bơi' },
      { name: 'Sở thích' },
      { name: 'Tivi' },
      { name: 'Phim ảnh' },
      { name: 'Công viên trò chơi' },
    ],
  },
  {
    name: 'Thiên nhiên',
    lessons: [
      { name: 'Động vật' },
      { name: 'Động vật lông vũ' },
      { name: 'Côn trùng' },
      { name: 'Sinh vật biển' },
      { name: 'Hoa quả' },
      { name: 'Rau' },
      { name: 'Thời tiết' },
      { name: 'Màu sắc' },
      { name: 'Phương hướng' },
    ],
  },
];
