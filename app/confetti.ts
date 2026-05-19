import JSConfetti from "js-confetti";

let confetti: JSConfetti | null = null;

export const showConfetti = (amount = 500) => {
  if (!confetti) {
    confetti = new JSConfetti();
  }

  confetti.addConfetti({
    confettiNumber: amount,
  });
};
