import { MessageSequence } from '../types';

export const INITIAL_SAMPLE_MESSAGES: MessageSequence = {
  id: 'secret-sequence-default',
  version: 1,
  updatedAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  layers: [
    {
      id: 'layer-intro',
      title: 'Màn 1: Chúc mừng chiến thắng',
      theme: 'amber',
      components: [
        {
          id: 'c-title-1',
          type: 'title',
          titleProps: {
            text: 'Chúc Mừng Bạn Đã Thắng Sudoku!',
            align: 'center',
            fontSize: 'xl',
          },
        },
        {
          id: 'c-img-1',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80',
            caption: 'Món quà bí mật dành riêng cho bạn',
            alt: 'Chúc mừng chiến thắng',
          },
        },
        {
          id: 'c-text-1',
          type: 'text',
          textProps: {
            text: 'Bạn đã xuất sắc chinh phục bàn Sudoku mức trung bình bằng sự kiên nhẫn và suy luận nhạy bén. Đây là bức thư được chuẩn bị riêng cho bạn với nhiều tầng cảm xúc.',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-btn-1',
          type: 'next_button',
          buttonProps: {
            label: 'Mở bức thư bí mật ✨',
            targetLayerId: 'layer-quiz',
          },
        },
      ],
      defaultNextLayerId: 'layer-quiz',
    },
    {
      id: 'layer-quiz',
      title: 'Màn 2: Trắc nghiệm tâm tình',
      theme: 'rose',
      components: [
        {
          id: 'c-title-2',
          type: 'title',
          titleProps: {
            text: 'Một Câu Hỏi Dành Cho Bạn',
            align: 'center',
            fontSize: 'lg',
          },
        },
        {
          id: 'c-text-2',
          type: 'text',
          textProps: {
            text: 'Trước khi tiếp tục, hãy chia sẻ điều đang dẫn lối cho trái tim bạn:',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-quiz-1',
          type: 'quiz',
          quizProps: {
            question: 'Khi đứng trước một hành trình mới, điều gì tiếp thêm cho bạn nhiều năng lượng nhất?',
            options: [
              {
                id: 'opt-resilience',
                label: 'Ý chí kiên định và bản lĩnh tự thân 🌟',
                targetLayerId: 'layer-resilience',
              },
              {
                id: 'opt-connection',
                label: 'Sự yêu thương và kết nối ấm áp từ người đồng hành ☕',
                targetLayerId: 'layer-connection',
              },
            ],
          },
        },
      ],
      defaultNextLayerId: 'layer-resilience',
    },
    {
      id: 'layer-resilience',
      title: 'Màn 3A: Nhánh Bản lĩnh',
      theme: 'indigo',
      components: [
        {
          id: 'c-title-3a',
          type: 'title',
          titleProps: {
            text: 'Ngọn Hải Đăng Của Ý Chí',
            align: 'center',
            fontSize: 'lg',
          },
        },
        {
          id: 'c-img-3a',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
            caption: 'Vững vàng trước mọi thử thách',
            alt: 'Bình minh và biển rộng',
          },
        },
        {
          id: 'c-text-3a',
          type: 'text',
          textProps: {
            text: 'Nội lực và sự kiên trì của bạn tựa như ánh hải đăng vững chãi trong đêm tối. Dù con đường phía trước có thử thách đến đâu, bạn luôn có đủ trí tuệ để tìm ra lời giải đẹp nhất.',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-btn-3a',
          type: 'next_button',
          buttonProps: {
            label: 'Đọc lời chúc kết thúc →',
            targetLayerId: 'layer-final',
          },
        },
      ],
      defaultNextLayerId: 'layer-final',
    },
    {
      id: 'layer-connection',
      title: 'Màn 3B: Nhánh Kết nối',
      theme: 'emerald',
      components: [
        {
          id: 'c-title-3b',
          type: 'title',
          titleProps: {
            text: 'Tách Trà Ấm & Những Yêu Thương',
            align: 'center',
            fontSize: 'lg',
          },
        },
        {
          id: 'c-img-3b',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
            caption: 'Ấm áp giữa những khoảnh khắc dịu êm',
            alt: 'Tách trà và cuốn sách',
          },
        },
        {
          id: 'c-text-3b',
          type: 'text',
          textProps: {
            text: 'Những điều ngọt ngào nhất trên thế gian luôn bắt đầu từ sự chân thành và thấu hiểu. Cảm ơn bạn vì đã luôn mang đến nguồn năng lượng dịu dàng, tử tế cho những người xung quanh.',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-btn-3b',
          type: 'next_button',
          buttonProps: {
            label: 'Đọc lời chúc kết thúc →',
            targetLayerId: 'layer-final',
          },
        },
      ],
      defaultNextLayerId: 'layer-final',
    },
    {
      id: 'layer-final',
      title: 'Màn 4: Lời chúc bình an',
      theme: 'warm',
      components: [
        {
          id: 'c-title-4',
          type: 'title',
          titleProps: {
            text: 'Chúc Bạn Luôn Rạng Rỡ & Bình An',
            align: 'center',
            fontSize: 'xl',
          },
        },
        {
          id: 'c-img-4',
          type: 'image',
          imageProps: {
            url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80',
            caption: 'Nắng ấm ngập tràn lối đi',
            alt: 'Ánh nắng bình yên',
          },
        },
        {
          id: 'c-text-4',
          type: 'text',
          textProps: {
            text: 'Cuộc sống đôi khi cũng giống như một bàn cờ nhiều ô trống: chỉ cần bình tĩnh suy ngẫm, mọi nút thắt đều sẽ tìm thấy câu trả lời hoàn hảo. Chúc bạn mỗi ngày đều đầy ắp nụ cười, hạnh phúc và thành công rực rỡ!',
            align: 'center',
            style: 'normal',
          },
        },
        {
          id: 'c-text-signature',
          type: 'text',
          textProps: {
            text: '— Gửi từ một người luôn ủng hộ và dõi theo bạn 💛',
            align: 'center',
            style: 'italic',
          },
        },
        {
          id: 'c-btn-restart',
          type: 'next_button',
          buttonProps: {
            label: 'Đọc lại từ đầu 🔄',
            targetLayerId: 'layer-intro',
          },
        },
      ],
      defaultNextLayerId: 'layer-intro',
    },
  ],
};
