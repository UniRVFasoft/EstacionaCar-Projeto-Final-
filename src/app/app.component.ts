import { Component, OnInit } from '@angular/core';
import { format } from 'date-fns';
import { Router } from '@angular/router';

interface Car {
  name: string;
  licence: string;
  time: string;
  owner: string;
  deleted?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'estacionamento';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const ownerInput = <HTMLInputElement>document.querySelector("#owner");
    ownerInput.value = localStorage.getItem('owner') || '';
    ownerInput.addEventListener('input', () => {
      localStorage.setItem('owner', ownerInput.value);
    });

    this.renderGarage();
    const sendButton = document.querySelector<HTMLButtonElement>("#send");
    if (sendButton) {
      sendButton.addEventListener("click", () => {
        this.onClickSend();
      });
    }
    const garageElement = document.querySelector<HTMLTableElement>("#garage");
    if (garageElement) {
      garageElement.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.className === "delete") {
          const tableRow = target.parentElement?.parentElement as HTMLTableRowElement;
          if (tableRow) {
            const cells = Array.from(tableRow.cells) as HTMLTableDataCellElement[];
            this.checkOut(cells);
          }
        }
      });
    }
  }

  renderGarage(): void {
    const garage = this.getGarage();
    const garageElement = document.querySelector("#garage");
    if (garageElement) {
      garageElement.innerHTML = "";
      garage.forEach(c => {
        if (!c.deleted) {
          this.addCarToGarage(c);
        }
      });
    }
  }

  addCarToGarage(car: Car): void {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="data-cell">${car.name}</td>
      <td>${car.licence}</td>
      <td>${car.owner}</td>
      <td data-time="${car.time}">
        ${this.formatDateTime(new Date(car.time))}
      </td>
      <td>
        <button class="delete">Deletar</button>
      </td>
    `;

    const deleteButton = row.querySelector(".delete") as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.style.backgroundColor = "#850a0a";
      deleteButton.style.color = "white";
      deleteButton.style.fontWeight = "bold";
    }

    const garageElement = document.querySelector("#garage");
    if (garageElement) {
      garageElement.appendChild(row);
    }
  }

  formatDateTime(dateTime: Date): string {
    return format(dateTime, 'dd/MM/yyyy HH:mm');
  }

  checkOut(info: HTMLTableDataCellElement[]): void {
    const startTime: string = info[3].dataset['time']!;
    const endTime: string = new Date().toISOString();
    const period: number = new Date(endTime).getTime() - new Date(startTime).getTime();
    const formattedPeriod: string = this.convertPeriod(period);
    const licence: string = info[1].textContent!;
    const msg: string = `O veículo ${info[0].textContent} de placa ${licence} permaneceu ${formattedPeriod} estacionado.\n\nDeseja encerrar?`;
    if (!confirm(msg)) return;
    const garage: Car[] = this.getGarage().map(c => {
      if (c.licence === licence) {
        return {
          ...c,
          deleted: true // Marcar o carro como deletado
        };
      }
      return c;
    });
    localStorage.setItem('garage', JSON.stringify(garage));
    this.renderGarage();
  }

  onClickSend(): void {
    const owner = (<HTMLInputElement>document.querySelector("#owner"))?.value;
    const name = (<HTMLInputElement>document.querySelector("#name"))?.value;
    const licence = (<HTMLInputElement>document.querySelector("#licence"))?.value;

    if (!name || !licence) {
      alert("Os campos são obrigatórios.");
      return;
    }

    // Verifica se a entrada corresponde ao padrão de placa
    const licensePlateRegex = /^[A-Z]{3}-\d{4}$/; // Exemplo: AAA-1234
    if (!licensePlateRegex.test(licence)) {
      alert("Placa inválida. O formato deve ser AAA-1234.");
      return;
    }

    // Verifica se o campo de nome do dono foi preenchido
    if (!owner) {
      alert("O campo Proprietário é obrigatório.");
      return;
    }

    const time = new Date().toISOString(); // Obter a data e hora atual em formato ISO string
    const car: Car = { name, licence, time, owner };
    const garage = this.getGarage();
    garage.push(car);
    localStorage.setItem('garage', JSON.stringify(garage));
    this.addCarToGarage(car);
    (<HTMLInputElement>document.querySelector("#name")).value = "";
    (<HTMLInputElement>document.querySelector("#licence")).value = "";
    (<HTMLInputElement>document.querySelector("#owner")).value = "";
  }

  showHistory(): void {
    const garage = this.getGarage();
    const history = garage.filter(car => car.deleted); // Filtrar apenas os carros deletados

    if (history.length > 0) {
      const tableContent = history.map(car => `
        <tr>
          <td>${car.licence}</td>
          <td>${car.name}</td>
          <td>${car.owner}</td>
          <td>${this.formatDateTime(new Date(car.time))}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body {
              background-image: url('assets/Black2.jpg'); /* Substitua pelo caminho da sua imagem */
              background-size: cover;
              background-repeat: no-repeat;
              background-position: center;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                background-color: rgb(187, 192, 63);
                border: 1px solid black;
                padding: 8px;
                text-align: left;
              }
              .clear-button {
                position: absolute;
                top: 10px;
                right: 10px;
                50px;color: rgb(255, 255, 255);
                background-color: #850a0a;
              }
              .history-title {
                background-color: rgb(187, 192, 63);
              }
            </style>
          </head>
          <body>
            <h2 class="history-title">Histórico de Veículos</h2>
            <button class="clear-button" onclick="clearHistory()">Limpar Histórico</button>
            <table id="history-table">
              <tr>
                <th>Placa</th>
                <th>Veículo</th>
                <th>Proprietário</th>
                <th>Entrada</th>
              </tr>
              ${tableContent}
            </table>
            <script>
              function clearHistory() {
                const table = document.getElementById('history-table');
                const rowCount = table.rows.length;
                for (let i = rowCount - 1; i > 0; i--) {
                  table.deleteRow(i);
                }
                localStorage.removeItem('garage');
              }
            </script>
          </body>
        </html>
      `;

      const newWindow = window.open();
      newWindow?.document.write(htmlContent);
    } else {
      alert("Não há histórico de veículos.");
    }
  }

  clearHistory(): void {
    localStorage.removeItem('garage');
    alert("Histórico de veículos limpo com sucesso!");
  }

  convertPeriod(mil: number): string {
    const min = Math.floor(mil / 60000);
    const sec = Math.floor((mil % 60000) / 1000);
    return `${min}m e ${sec}s`;
  }

  getGarage(): Car[] {
    const garageData = localStorage.getItem('garage');
    if (garageData) {
      return JSON.parse(garageData);
    }
    return [];
  }
}
