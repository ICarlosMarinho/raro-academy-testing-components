import { Cadastro } from "../Cadastro";

import { act, fireEvent, render, screen } from "@testing-library/react";
import faker from "@faker-js/faker";
import { validaErroApresentadoEmTela } from "../../helpers/teste/validaErroApresentadoEmTela";
import { validaErroNaoApresentadoEmTela } from "../../helpers/teste/validaErroNaoApresentadoEmTela";
import { setValorInput } from "../../helpers/teste/setValorInput";
import axios from "axios";

const makeSut = () => {
  return render(<Cadastro />);
};

const preencheCampos = (dados: Record<string, string>) => () => {
  const nome = screen.getByPlaceholderText("Nome");
  const email = screen.getByPlaceholderText("e-mail");
  const senha = screen.getByPlaceholderText("Senha");
  const confirmacaoSenha = screen.getByPlaceholderText("Confirmação de Senha");
  const codigoAcesso = screen.getByPlaceholderText("Código de Acesso");

  setValorInput(nome, dados.nome);
  setValorInput(email, dados.email);
  setValorInput(senha, dados.senha);
  setValorInput(confirmacaoSenha, dados.senha);
  setValorInput(codigoAcesso, dados.codigoAcesso);
};

describe("Cadastro Page", () => {
  beforeEach(jest.clearAllMocks);
  beforeEach(makeSut);

  it("deve bloquear o submit caso os campos não estejam válidos", () => {
    const button = screen.getByText("Cadastrar");

    expect(button).toBeDisabled();
  });

  describe("deve validar o formato de e-mail no cadastro", () => {
    const mensagemDeValidacao = "Formato de e-mail inválido";
    let input: HTMLElement;

    beforeEach(() => {
      input = screen.getByPlaceholderText("e-mail");
    });

    it("deve ter username", () => {
      const value = "@test.com";

      validaErroApresentadoEmTela(input, mensagemDeValidacao, value);
    });

    it("deve ter domínio de nível superior", () => {
      const value = "username@test";

      validaErroApresentadoEmTela(input, mensagemDeValidacao, value);
    });

    it("deve ter domínio de segundo nível", () => {
      const value = "username@.com";

      validaErroApresentadoEmTela(input, mensagemDeValidacao, value);
    });

    it("deve ter caractere @", () => {
      const value = "usernametest.com";

      validaErroApresentadoEmTela(input, mensagemDeValidacao, value);
    });

    it("deve ter apenas um caractere @", () => {
      const value = "user@name@test.com";

      validaErroApresentadoEmTela(input, mensagemDeValidacao, value);
    });

    it("não deve apresentar erro quando o formato é válido", () => {
      const value = faker.internet.email();

      validaErroNaoApresentadoEmTela(input, value, mensagemDeValidacao);
    });
  });

  describe("deve validar os critérios de aceitação da senha", () => {
    let input: HTMLElement;
    beforeEach(() => {
      input = screen.getByPlaceholderText("Senha");
    });

    it("senha deve ter 8 dígitos ou mais", () => {
      const value = faker.lorem.paragraph();
      const mensagemDeValidacao = "Senha deve ter ao menos 8 caracteres";
      validaErroApresentadoEmTela(input, mensagemDeValidacao);
      validaErroNaoApresentadoEmTela(input, value, mensagemDeValidacao);
    });

    it("senha deve ter letra maiuscula", () => {
      const value = "Teste";
      const mensagemDeValidacao = "Senha deve conter pelo menos uma letra maiúscula";
      validaErroApresentadoEmTela(input, mensagemDeValidacao);
      validaErroNaoApresentadoEmTela(input, value, mensagemDeValidacao);
    });

    it("senha deve ter letra minúscula", () => {
      const value = "Teste";
      const mensagemDeValidacao = "Senha deve conter pelo menos uma letra minúscula";
      validaErroApresentadoEmTela(input, mensagemDeValidacao);
      validaErroNaoApresentadoEmTela(input, value, mensagemDeValidacao);
    });

    it("senha deve ter números", () => {
      const value = "Teste 1";
      const mensagemDeValidacao = "Senha deve conter pelo menos um número";
      validaErroApresentadoEmTela(input, mensagemDeValidacao);
      validaErroNaoApresentadoEmTela(input, value, mensagemDeValidacao);
    });

    it("senha deve ter caracteres especiais", () => {
      const value = "Teste@1";
      const mensagemDeValidacao = "Senha deve conter pelo menos um caractere especial";
      validaErroApresentadoEmTela(input, mensagemDeValidacao);
      validaErroNaoApresentadoEmTela(input, value, mensagemDeValidacao);
    });

    it("deve garantir que senha e confirmação sejam iguais", () => {
      const value = "Teste";
      const mensagemValidacao = "Senhas não conferem";
      const inputConfirmacao = screen.getByPlaceholderText("Confirmação de Senha");

      fireEvent.change(input, { target: { value } });
      fireEvent.blur(inputConfirmacao);

      expect(screen.queryByText(mensagemValidacao)).not.toBeNull();
    });
  });

  describe("deve validar a ação de submit do formulário", () => {
    const dados = {
      nome: faker.name.firstName(),
      email: faker.internet.email(),
      senha: "S3nh@!123",
      codigoAcesso: faker.lorem.paragraph()
    };

    beforeEach(preencheCampos(dados));

    it("deve enviar o formulário se todos os dados estiverem preenchidos corretamente", async () => {
      const botao = screen.getByText("Cadastrar");

      jest.spyOn(axios, "post").mockResolvedValue("ok");

      await act(() => botao.click());

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/auth/cadastrar"), dados);
    });

    it("deve notificar o usuário que o cadastro foi efetuado com sucesso", async () => {
      const botao = screen.getByText("Cadastrar");
      const resultado = "Cadastrado com sucesso!";

      jest.spyOn(axios, "post").mockResolvedValue({ data: { statusCode: 201 } });

      await act(() => botao.click());

      expect(screen.queryByText(resultado)).toBeInTheDocument();
    });

    it("deve apresentar mensagem de erro retornada pela api", async () => {
      const botao = screen.getByText("Cadastrar");
      const resultado = "usuario ja existe";

      jest.spyOn(axios, "post").mockRejectedValue({
        isAxiosError: true,
        response: { data: { statusCode: 400, message: resultado } }
      });

      await act(() => botao.click());

      expect(screen.queryByText(resultado)).toBeInTheDocument();
    });

    it("deve apresentar mensagem de erro genérica", async () => {
      const botao = screen.getByText("Cadastrar");
      const resultado = "Um erro inesperado ocorreu";

      jest.spyOn(axios, "post").mockRejectedValue({
        response: { data: { statusCode: 400 } }
      });

      await act(() => botao.click());

      expect(screen.queryByText(resultado)).toBeInTheDocument();
    });
  });
});
