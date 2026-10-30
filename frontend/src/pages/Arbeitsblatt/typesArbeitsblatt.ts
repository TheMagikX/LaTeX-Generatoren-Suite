// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ArbeitsblattConfig {
  template_text: string;
  python_code: string;
  random_seed: string;
  header_title: string;
  header_title_spacing: string;
  header_title_visible: boolean;
  header_class: string;
  header_dozent: string;
  header_subject: string;
  add_qrcode: boolean;
  pakete_laden: boolean;
  command_laden: boolean;
  font_family: string;
}
