import type { MessageSequence } from '../types';

export const INITIAL_SAMPLE_MESSAGES: MessageSequence = {
  id: "secret-sequence-default",
  version: 4,
  updatedAt: "2026-10-19T13:44:21.271Z",
  publishedAt: "2026-10-19T13:44:21.271Z",
  layers: [
    {
      id: "layer-intro",
      title: "Màn 1: Ơn giời cô ấy đây rồi",
      theme: "rose",
      components: [
        {
          id: "c-title-1",
          type: "title",
          titleProps: {
            text: "Ơn giời, cô ấy đây rồi!",
            align: "center",
            fontSize: "xl"
          }
        },
        {
          id: "c-img-1",
          type: "image",
          imageProps: {
            url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
            caption: "Món quà bí mật dành riêng cho bạn",
            alt: "Chúc mừng chiến thắng"
          }
        },
        {
          id: "c-text-1",
          type: "text",
          textProps: {
            text: "Cảm ơn Thượng đế vì trên đời vẫn còn người con gái vừa thông minh lại vừa xinh đẹp như em!",
            align: "center",
            style: "normal"
          }
        },
        {
          id: "c-btn-1",
          type: "next_button",
          buttonProps: {
            label: "Cảm ơn em ✨ ",
            targetLayerId: "layer-mvf62fhg"
          }
        }
      ],
      defaultNextLayerId: "layer-quiz"
    },
    {
      id: "layer-mvf62fhg",
      title: "Màn 2: cảm ơn em",
      theme: "rose",
      components: [
        {
          id: "title-1792409046244",
          type: "title",
          titleProps: {
            text: "Cảm ơn em bé!",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "text-1792409046244",
          type: "text",
          textProps: {
            text: "Cảm ơn em đã kiên nhẫn chơi và đọc đến đây. Cảm ơn em đã cho anh có được cơ hội trò chuyện với em và cảm nhận trái tim lại lệch nhịp thêm lần nữa.",
            align: "center"
          }
        },
        {
          id: "btn-1792409046244",
          type: "next_button",
          buttonProps: {
            label: "Anh mong",
            targetLayerId: "layer-mvf6l2l1"
          }
        }
      ]
    },
    {
      id: "layer-mvf6l2l1",
      title: "Màn 3: Mong muốn của anh",
      theme: "emerald",
      components: [
        {
          id: "title-mvf6l2l1-84",
          type: "title",
          titleProps: {
            text: "Anh mong rằng!",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "text-mvf6l2l1-56",
          type: "text",
          textProps: {
            text: "Anh mong sao từ bây giờ cho đến những ngày sau này, mỗi ngày đều có thể trò chuyện cùng em, dù ở xa hay ở gần. Mỗi ngày đều có thể chia sẻ với nhau những chuyện buồn vui, to nhỏ, những ước mơ, những dự định và cả những điều hơi ngớ ngẩn.",
            align: "center"
          }
        },
        {
          id: "next_button-mvf6l2l1-82",
          type: "next_button",
          buttonProps: {
            label: "Nhưng anh nghĩ ",
            targetLayerId: "layer-mvf6qxvp"
          }
        }
      ]
    },
    {
      id: "layer-mvf6qxvp",
      title: "Màn 4: Nhưng anh nghĩ",
      theme: "emerald",
      components: [
        {
          id: "title-mvf6qxvq-18",
          type: "title",
          titleProps: {
            text: "Nhưng anh nghĩ!",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "text-mvf6qxvq-78",
          type: "text",
          textProps: {
            text: "Nhưng anh nghĩ, để đi được dài như vậy, thì trước tiên phải bắt đầu từ 1 bước chân. Như người ta nói: nếu khoảng cách giữa chúng mình là 100 bước, chỉ cần em bước về phía anh 1 bước, anh sẽ hoàn thành 99 bước còn lại.",
            align: "center"
          }
        },
        {
          id: "next_button-mvf6qxvq-14",
          type: "next_button",
          buttonProps: {
            label: "Bước đầu tiên ...",
            targetLayerId: "layer-mvf7ceqg"
          }
        }
      ]
    },
    {
      id: "layer-mvf7ceqg",
      title: "Màn 5: Bước đầu tiên",
      theme: "warm",
      components: [
        {
          id: "title-mvf7ceqg-17",
          type: "title",
          titleProps: {
            text: "Và bước đầu tiên là:",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "text-mvf7ceqg-92",
          type: "text",
          textProps: {
            text: "Ngồi cafe bên cạnh em thì bình yên thật đấy, nhưng anh mong muốn được làm điều gì đấy cùng em, trải nghiệm nhiều hơn thay vì chỉ ngồi 1 chỗ và nhiều khi 2 người rơi vào những khoảng không im lặng mà chẳng thể hiểu đối phương đang nghĩ gì. Vậy nên",
            align: "center"
          }
        },
        {
          id: "next_button-mvf7ceqg-63",
          type: "next_button",
          buttonProps: {
            label: "Vậy nên ",
            targetLayerId: "layer-mvf7f8pt"
          }
        }
      ]
    },
    {
      id: "layer-mvf7f8pt",
      title: "Màn 6: Vậy nên",
      theme: "warm",
      components: [
        {
          id: "title-mvf7f8pt-24",
          type: "title",
          titleProps: {
            text: "Vậy nên:",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "text-mvf7f8pt-45",
          type: "text",
          textProps: {
            text: "Nếu được, chúng mình đi dạo nhé, cùng ngắm phố Hà Nội mùa thu đẹp dịu dàng như em, lang thang qua mấy tiệm sách  hay đi cafe board game cũng thú vị mà.",
            align: "center"
          }
        },
        {
          id: "next_button-mvf7f8pt-49",
          type: "next_button",
          buttonProps: {
            label: "?",
            targetLayerId: "layer-quiz"
          }
        }
      ]
    },
    {
      id: "layer-quiz",
      title: "Màn 7: Em đồng ý nhé",
      theme: "rose",
      components: [
        {
          id: "c-title-2",
          type: "title",
          titleProps: {
            text: "Em đồng ý nhé ^^",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "c-text-2",
          type: "text",
          textProps: {
            text: "Em đồng ý nhé, đồng ý để anh nắm tay em thong thả đi qua những vỉa hè rợp bóng cây của chiều thu Hà Nội.",
            align: "center",
            style: "normal"
          }
        },
        {
          id: "c-quiz-1",
          type: "quiz",
          quizProps: {
            options: [
              {
                id: "opt-resilience",
                label: "Vâng  ^^🌟",
                targetLayerId: "layer-resilience"
              },
              {
                id: "opt-connection",
                label: "Chắc em cần thêm thời gian☕",
                targetLayerId: "layer-connection"
              }
            ],
            question: "Cuối tuần này nha!"
          }
        }
      ],
      defaultNextLayerId: "layer-resilience"
    },
    {
      id: "layer-resilience",
      title: "Màn 3A: Vâng",
      theme: "rose",
      components: [
        {
          id: "c-title-3a",
          type: "title",
          titleProps: {
            text: "Tuyệt vời! Anh đợi câu trả lời này mà hồi hộp quá!",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "c-img-3a",
          type: "image",
          imageProps: {
            url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
            caption: "Đây có lẽ là ánh sáng đầu tiên sau những ngày đầy giông bão trong cuộc sống của anh",
            alt: "Bình minh và biển rộng"
          }
        },
        {
          id: "c-text-3a",
          type: "text",
          textProps: {
            text: "Cảm ơn em đã đồng ý, có lẽ đây là những tia nắng đầu tiên trong chuỗi dài đêm đen tăm tối trong cuộc sống của anh nhiều ngày qua.",
            align: "center",
            style: "normal"
          }
        },
        {
          id: "c-btn-3a",
          type: "next_button",
          buttonProps: {
            label: "Vậy chúng mình →",
            targetLayerId: "layer-final"
          }
        }
      ],
      defaultNextLayerId: "layer-final"
    },
    {
      id: "layer-final",
      title: "Màn 4: Vậy chúng mình",
      theme: "rose",
      components: [
        {
          id: "c-title-4",
          type: "title",
          titleProps: {
            text: "Vậy chúng mình ...",
            align: "center",
            fontSize: "xl"
          }
        },
        {
          id: "c-img-4",
          type: "image",
          imageProps: {
            url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80",
            caption: "Nắng ấm ngập tràn lối đi",
            alt: "Ánh nắng bình yên"
          }
        },
        {
          id: "c-text-4",
          type: "text",
          textProps: {
            text: "Vậy chúng mình thử hẹn hò em nhé, chúc em 20-10 này sẽ thật vui vẻ. Cuối tuần này mình bắt đầu nhé. Em chỉ cần \"Ừ\" một tiếng trong message là anh biết em đã đọc đến đây rồi. Mong là em sẽ đọc đến đây và nhắn \"Ừ\". ^^",
            align: "center",
            style: "normal"
          }
        },
        {
          id: "c-text-signature",
          type: "text",
          textProps: {
            text: "— Gửi từ một người đang tìm đường vào 💛 em",
            align: "center",
            style: "italic"
          }
        },
        {
          id: "c-btn-restart",
          type: "next_button",
          buttonProps: {
            label: "Đọc lại từ đầu 🔄",
            targetLayerId: "layer-intro"
          }
        }
      ],
      defaultNextLayerId: "layer-intro"
    },
    {
      id: "layer-connection",
      title: "Màn 3B: Chắc em cần thêm thời gian",
      theme: "amber",
      components: [
        {
          id: "c-title-3b",
          type: "title",
          titleProps: {
            text: "Uhm, có lẽ là ...",
            align: "center",
            fontSize: "lg"
          }
        },
        {
          id: "c-img-3b",
          type: "image",
          imageProps: {
            url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80",
            caption: "anh sẽ cố gắng nhiều hơn",
            alt: "Tách trà và cuốn sách"
          }
        },
        {
          id: "c-text-3b",
          type: "text",
          textProps: {
            text: "Có lẽ là em cần thêm thời gian, à không, là anh cần thêm thời gian để em cảm nhận được sự chân thành của anh. Bắt đầu từ hôm nay anh sẽ bắt đầu hành trình tìm đường vào trái tim em nhé. Cho anh cơ hội này nhé, anh sẽ nắm bắt thật là tốt.",
            align: "center",
            style: "normal"
          }
        },
        {
          id: "c-btn-3b",
          type: "next_button",
          buttonProps: {
            label: "Đọc lại từ đầu 🔄",
            targetLayerId: "layer-intro"
          }
        }
      ],
      defaultNextLayerId: "layer-final"
    }
  ]
};
