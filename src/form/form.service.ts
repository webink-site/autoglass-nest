/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';

@Injectable()
export class FormService {
  private readonly accessToken =
    '6d72d964eb0f056507f1e50c4c918bf80fdce63a0bf9f4b248e0d66f8e14d1b587552a0fe56e9b93b56bc'; // токен сообщества
  private readonly groupId = 227774670; // без минуса
  private readonly apiVersion = '5.131';

  async sendMessageVk(data: { name: string; phone: string; message?: string }) {
    const text = `📥 Новая заявка:
👤 Имя: ${data.name}
📞 Телефон: ${data.phone}
📝 Сообщение: ${data.message || '—'}`;

    const url = 'https://api.vk.com/method/messages.send';
    const params = new URLSearchParams({
      access_token: this.accessToken,
      v: this.apiVersion,
      random_id: Date.now().toString(),
      peer_id: '7090358', // ID пользователя
      message: text,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const json = await response.json();

    if (json.error) {
      const { error_code, error_msg } = json.error;

      if (error_code === 901) {
        throw new Error(
          'VK API: Нельзя отправить сообщение этому пользователю — он не написал первым. Пусть откроет диалог: https://vk.me/autoglassgtn',
        );
      }

      throw new Error(`VK Error: ${error_msg}`);
    }

    return {
      success: true,
      vkResponse: json.response,
    };
  }
}
