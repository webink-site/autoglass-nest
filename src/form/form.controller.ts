import { Body, Controller, Post } from '@nestjs/common';
import { FormService } from './form.service';

@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post('vk')
  async sendMessageVk(
    @Body() body: { name: string; phone: string; message?: string },
  ) {
    return this.formService.sendMessageVk(body);
  }
}
