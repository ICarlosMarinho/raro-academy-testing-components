import { fireEvent, screen } from "@testing-library/react";

export const validaErroApresentadoEmTela = (input: HTMLElement, mensagem: string, value = "") => {
  if (value) {
    fireEvent.change(input, { target: value });
  }

  fireEvent.blur(input);
  screen.getByText(mensagem);
};
