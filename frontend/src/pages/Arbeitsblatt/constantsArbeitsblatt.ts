// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ArbeitsblattConfig } from './typesArbeitsblatt'

export const DEFAULT_TEMPLATE = `\\begin{questions}
\\question Löse die folgenden Klammern auf:

\\begin{enumerate}
{% for task in tasks %}
    \\item $({{ task.a }}x + {{ task.b }}y)^2 = $ 
    {% if show_solution %}
        {\\color{red} \${{ task.a**2 }}x^2 + {{ 2 * task.a * task.b }}xy + {{ task.b**2 }}y^2$}
    {% else %}
        \\vspace{1cm} % Platz zum Rechnen für Schüler
    {% endif %}
{% endfor %}
\\end{enumerate}
\\end{questions}`

export const DEFAULT_PYTHON_CODE = `import random

# Anzahl der Aufgaben
num_tasks = 3

# Aufgabenliste generieren
tasks = []
for _ in range(num_tasks):
    a = random.randint(2, 12)
    b = random.randint(2, 12)
    tasks.append({"a": a, "b": b})`

export const DEFAULT_CONFIG: ArbeitsblattConfig = {
  template_text: DEFAULT_TEMPLATE,
  python_code: DEFAULT_PYTHON_CODE,
  random_seed: '',
  header_title: 'Arbeitsblatt',
  header_title_spacing: '-12pt',
  header_title_visible: true,
  header_class: 'Klasse 8',
  header_dozent: 'Lehrkraft',
  header_subject: 'Mathematik',
  add_qrcode: false,
  pakete_laden: true,
  command_laden: true,
  font_family: 'Fira',
}
