const puppeteer = require("puppeteer");

module.exports.scrape = async (user, password) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
  );
  await page.setViewport({
    width: 1366,
    height: 768,
  });

  await login(page, user, password);
  const accountInfo = await getAccountInfo(page);
  const statement = await getStatement(page);

  browser.close();

  return {
    accountInfo,
    statement,
  };
};

async function login(page, user, password) {
  await page.goto("https://internetbanking.caixa.gov.br/sinbc/#!nb/login");

  await page.waitFor(".showMessageBox");
  await page.waitFor(2000);

  await page.type("#nomeUsuario", user);
  await page.keyboard.press("Enter");

  await page.waitFor(4000);
  await page.click("#lnkInitials");

  await page.waitFor("#teclado");
  await page.waitFor(2000);

  await page.evaluate((password) => {
    document.querySelector("#password").value = password;
  }, password);

  await page.click("#btnConfirmar");
}

async function getAccountInfo(page) {
  await page.waitFor("#visibleSaldo");
  await page.waitFor(2000);

  return await page.evaluate(() => {
    const panel = document.getElementsByClassName("painelContaFonte3");
    const balance = document.getElementById("visibleSaldo");
    const clientName = document.getElementById("clientNome");

    return {
      saldo: balance && balance.innerText,
      nome: clientName && clientName.innerText,
      agencia: panel[0] && panel[0].innerText,
      operacao: panel[1] && panel[1].innerText,
      conta: panel[2] && panel[2].innerText,
    };
  });
}

async function getStatement(page) {
  await page.waitFor(2000);
  await page.goto(
    "https://internetbanking.caixa.gov.br/SIIBC/interna#!/extrato.processa"
  );

  await page.waitFor(".produto");
  await page.waitFor(2000);

  return await page.evaluate(() => {
    let situationsBalance = Array.from(
      document.querySelectorAll(".produto tbody tr")
    );
    situationsBalance = situationsBalance.map((situacaoSaldo) => {
      const [description, balance] = situacaoSaldo.innerText.split("	");
      return { description, balance };
    });

    let statements = Array.from(
      document.querySelectorAll(".movimentacao tbody tr")
    );
    statements = statements.slice(2);
    statements = statements.map((statement) => {
      const [data, nr, hist, val, sal] = statement.innerText.split("	");
      return { data, nr, hist, val, sal };
    });

    return { situationsBalance, statements };
  });
}
