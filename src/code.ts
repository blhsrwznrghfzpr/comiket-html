interface IfRequest {
  parameter: {
    id: string;
  };
}
interface IfHtmlTemplate extends GoogleAppsScript.HTML.HtmlTemplate {
  url?: string;
}

function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(request: IfRequest): GoogleAppsScript.HTML.HtmlOutput {
  if (!request || !request.parameter || !request.parameter.id) {
    return HtmlService.createHtmlOutput("無効なリクエストです");
  }
  const id: string = request.parameter.id;
  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadSheet.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  let url: string = "";
  // 1行目はヘッダなのでスキップ
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === id && row[1]) {
      url = row[1].toString();
      break;
    }
  }
  if (!url) {
    return HtmlService.createHtmlOutput("無効なidです");
  }
  const template: IfHtmlTemplate = HtmlService.createTemplateFromFile("index");
  template.url = url;
  return template.evaluate();
}

const headerClassMap_ = {
  "ID": "id",
  "サークル名": "circleName",
  "場所": "place",
  "システム": "system",
  "頒布物種別": "type",
  "新刊・既刊": "isNewBook",
  "頒布物タイトル": "bookTitle",
  "値段": "price",
  "コメントなど": "comment",
  "URL": "url",
  "タイムスタンプ": "timestamp", // ~C90
};
interface IfDataSet {
  title: string;
  tableContent: string;
}

function getDataSet(url: string): string {
  const spreadSheet = SpreadsheetApp.openByUrl(url);
  const sheet = spreadSheet.getSheets()[0];
  const data: object[][] = sheet.getDataRange().getValues();
  const header: object[] = data[0];
  const thContents: string = header
    .map((col) => col.toString())
    .map((col) => `<th class="${headerClassMap_[col]}">${col}</th>`)
    .reduce((txt, col) => txt + col, "");
  let tbodyContent: string = "";
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // IDのみの場合は表示しない
    if (!row[1]) {
      continue;
    }
    const tds = row
      .map((col) => col.toString())
      .map((col) => paddingAnchorTag_(col))
      .map((col) => `<td>${col}</td>`)
      .reduce((txt, col) => txt + col, "");
    tbodyContent += `<tr>${tds}</tr>`;
  }
  const tableContent: string = `
    <table id="sorted" class="tablesorter">
      <thead>
        <tr>${thContents}</tr>
      </thead>
      <tbody>
        ${tbodyContent}
      </tbody>
    </table>
  `;
  const dataSet: IfDataSet = {
    title: spreadSheet.getName(),
    tableContent,
  };
  return JSON.stringify(dataSet);
}

function paddingAnchorTag_(str: string): string {
  const validPattern = /^http(s)?:\/\//;
  if (!str.match(validPattern)) {
    return str;
  }
  const dispUrl = str.length < 37 ? str : `${str.substring(0, 37)}...`;
  return `<a href="${str}" target="_blank">${dispUrl}</a>`;
}
