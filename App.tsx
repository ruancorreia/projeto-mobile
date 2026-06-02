import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getBookAnswerKey,
  type GabaritoCor,
  type GabaritoPenseBem,
} from "./src/gabarito";

type Option = "A" | "B" | "C" | "D";
type Stage = "ENTRY" | "RUNNING" | "PROGRAM_END" | "BOOK_END";

type ProgramResult = {
  programNumber: number;
  score: number;
  totalQuestions: number;
};

const QUESTIONS_PER_PROGRAM = 30;
const REGULAR_PROGRAMS = 5;
const FINAL_PROGRAM_NUMBER = 6;
const FINAL_PROGRAM_QUESTIONS = 6;
const MAX_ATTEMPTS = 3;

const PROGRAM_KEYS = [
  "programa_1",
  "programa_2",
  "programa_3",
  "programa_4",
  "programa_5",
] as const;

const KEY_TO_OPTION: Record<string, Option> = {
  q: "A",
  w: "B",
  a: "C",
  s: "D",
};

const COLOR_TO_OPTION: Record<GabaritoCor, Option> = {
  Vermelho: "A",
  Amarelo: "B",
  Azul: "C",
  Verde: "D",
};

const DIGITAL_SEGMENTS: Record<string, string[]> = {
  "0": ["top", "upperLeft", "upperRight", "lowerLeft", "lowerRight", "bottom"],
  "1": ["upperRight", "lowerRight"],
  "2": ["top", "upperRight", "middle", "lowerLeft", "bottom"],
  "3": ["top", "upperRight", "middle", "lowerRight", "bottom"],
  "4": ["upperLeft", "upperRight", "middle", "lowerRight"],
  "5": ["top", "upperLeft", "middle", "lowerRight", "bottom"],
  "6": ["top", "upperLeft", "middle", "lowerLeft", "lowerRight", "bottom"],
  "7": ["top", "upperRight", "lowerRight"],
  "8": [
    "top",
    "upperLeft",
    "upperRight",
    "middle",
    "lowerLeft",
    "lowerRight",
    "bottom",
  ],
  "9": ["top", "upperLeft", "upperRight", "middle", "lowerRight", "bottom"],
};

function DigitalNumber({ value }: { value: string }) {
  return (
    <View style={styles.digitalNumber}>
      {value.split("").map((digit, index) => {
        const activeSegments = DIGITAL_SEGMENTS[digit] ?? [];

        return (
          <View key={`${digit}-${index}`} style={styles.digitalDigit}>
            <View
              style={[
                styles.digitalSegment,
                styles.segmentHorizontal,
                styles.segmentTop,
                activeSegments.includes("top") && styles.digitalSegmentActive,
              ]}
            />
            <View
              style={[
                styles.digitalSegment,
                styles.segmentVertical,
                styles.segmentUpperLeft,
                activeSegments.includes("upperLeft") &&
                  styles.digitalSegmentActive,
              ]}
            />
            <View
              style={[
                styles.digitalSegment,
                styles.segmentVertical,
                styles.segmentUpperRight,
                activeSegments.includes("upperRight") &&
                  styles.digitalSegmentActive,
              ]}
            />
            <View
              style={[
                styles.digitalSegment,
                styles.segmentHorizontal,
                styles.segmentMiddle,
                activeSegments.includes("middle") &&
                  styles.digitalSegmentActive,
              ]}
            />
            <View
              style={[
                styles.digitalSegment,
                styles.segmentVertical,
                styles.segmentLowerLeft,
                activeSegments.includes("lowerLeft") &&
                  styles.digitalSegmentActive,
              ]}
            />
            <View
              style={[
                styles.digitalSegment,
                styles.segmentVertical,
                styles.segmentLowerRight,
                activeSegments.includes("lowerRight") &&
                  styles.digitalSegmentActive,
              ]}
            />
            <View
              style={[
                styles.digitalSegment,
                styles.segmentHorizontal,
                styles.segmentBottom,
                activeSegments.includes("bottom") &&
                  styles.digitalSegmentActive,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function getProgramKey(
  programNumber: number,
): (typeof PROGRAM_KEYS)[number] | null {
  if (programNumber >= 1 && programNumber <= REGULAR_PROGRAMS) {
    return PROGRAM_KEYS[programNumber - 1];
  }

  return null;
}

function getQuestionTotalByProgram(
  programNumber: number,
  answerKey: GabaritoPenseBem | null,
): number {
  if (programNumber === FINAL_PROGRAM_NUMBER) {
    return FINAL_PROGRAM_QUESTIONS;
  }

  const programKey = getProgramKey(programNumber);
  if (!answerKey || !programKey) {
    return QUESTIONS_PER_PROGRAM;
  }

  return answerKey[programKey].length;
}

function buildFinalProgramQuestions(
  bookCode: string,
  allQuestionNumbers: number[],
): number[] {
  const allQuestions = [...allQuestionNumbers];
  let seed = (Number(bookCode) || 1) * 7919;

  for (let i = allQuestions.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  return allQuestions.slice(0, FINAL_PROGRAM_QUESTIONS);
}

function getCorrectOption(
  questionKey: number,
  colorByQuestion: Map<number, GabaritoCor>,
): Option | null {
  const color = colorByQuestion.get(questionKey);
  if (!color) {
    return null;
  }

  return COLOR_TO_OPTION[color];
}

export default function App() {
  const [bookCodeInput, setBookCodeInput] = useState<string>("");
  const [programNumberInput, setProgramNumberInput] = useState<string>("");
  const [activeBookCode, setActiveBookCode] = useState<string>("");
  const [activeAnswerKey, setActiveAnswerKey] =
    useState<GabaritoPenseBem | null>(null);
  const [entryError, setEntryError] = useState<string>("");
  const [stage, setStage] = useState<Stage>("ENTRY");

  const [programNumber, setProgramNumber] = useState<number>(1);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [programScore, setProgramScore] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [programResults, setProgramResults] = useState<ProgramResult[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [finalProgramQuestions, setFinalProgramQuestions] = useState<number[]>(
    [],
  );
  const programNumberInputRef = useRef<TextInput>(null);

  const allQuestions = useMemo(
    () =>
      activeAnswerKey
        ? PROGRAM_KEYS.flatMap((programKey) => activeAnswerKey[programKey])
        : [],
    [activeAnswerKey],
  );

  const colorByQuestion = useMemo(
    () =>
      new Map<number, GabaritoCor>(
        allQuestions.map((item) => [item.questao, item.cor]),
      ),
    [allQuestions],
  );

  const currentQuestionTotal = useMemo(
    () => getQuestionTotalByProgram(programNumber, activeAnswerKey),
    [activeAnswerKey, programNumber],
  );

  const currentQuestionKey = useMemo(() => {
    if (programNumber === FINAL_PROGRAM_NUMBER) {
      return finalProgramQuestions[questionNumber - 1] ?? questionNumber;
    }

    const programKey = getProgramKey(programNumber);
    if (!activeAnswerKey || !programKey) {
      return (programNumber - 1) * QUESTIONS_PER_PROGRAM + questionNumber;
    }

    return (
      activeAnswerKey[programKey][questionNumber - 1]?.questao ?? questionNumber
    );
  }, [activeAnswerKey, finalProgramQuestions, programNumber, questionNumber]);

  const saveProgramResultAndMove = useCallback(
    (nextProgramScore: number) => {
      const totalQuestions = getQuestionTotalByProgram(
        programNumber,
        activeAnswerKey,
      );

      setProgramResults((prev) => [
        ...prev,
        {
          programNumber,
          score: nextProgramScore,
          totalQuestions,
        },
      ]);

      if (programNumber === FINAL_PROGRAM_NUMBER) {
        setStage("BOOK_END");
        return;
      }

      setStage("PROGRAM_END");
    },
    [activeAnswerKey, programNumber],
  );

  const goToNextQuestion = useCallback(
    (nextProgramScore: number) => {
      if (questionNumber < currentQuestionTotal) {
        setQuestionNumber((prev) => prev + 1);
        setAttemptNumber(1);
        return;
      }

      saveProgramResultAndMove(nextProgramScore);
    },
    [currentQuestionTotal, questionNumber, saveProgramResultAndMove],
  );

  const handleAnswer = useCallback(
    (selected: Option) => {
      if (stage !== "RUNNING") {
        return;
      }

      const correct = getCorrectOption(currentQuestionKey, colorByQuestion);

      if (!correct) {
        setFeedback("Questao sem gabarito. Pulando para a proxima.");
        goToNextQuestion(programScore);
        return;
      }

      if (selected === correct) {
        const pointsEarned = MAX_ATTEMPTS - attemptNumber + 1;
        const nextProgramScore = programScore + pointsEarned;
        const nextTotalScore = totalScore + pointsEarned;

        setProgramScore(nextProgramScore);
        setTotalScore(nextTotalScore);
        setFeedback(`Acertou e ganhou ${pointsEarned} ponto(s).`);
        goToNextQuestion(nextProgramScore);
        return;
      }

      if (attemptNumber < MAX_ATTEMPTS) {
        const nextAttempt = attemptNumber + 1;
        setAttemptNumber(nextAttempt);
        setFeedback(
          `Resposta incorreta. Tentativa ${nextAttempt}/${MAX_ATTEMPTS}.`,
        );
        return;
      }

      setFeedback("Errou as 3 tentativas. Seguindo para a proxima pergunta.");
      goToNextQuestion(programScore);
    },
    [
      attemptNumber,
      colorByQuestion,
      currentQuestionKey,
      goToNextQuestion,
      programScore,
      stage,
      totalScore,
    ],
  );

  useEffect(() => {
    if (stage !== "RUNNING") {
      return;
    }

    const eventTarget = globalThis as {
      addEventListener?: (
        type: string,
        listener: (event: {
          key?: string;
          preventDefault?: () => void;
        }) => void,
      ) => void;
      removeEventListener?: (
        type: string,
        listener: (event: {
          key?: string;
          preventDefault?: () => void;
        }) => void,
      ) => void;
    };

    if (!eventTarget.addEventListener || !eventTarget.removeEventListener) {
      return;
    }

    const onKeyDown = (event: {
      key?: string;
      preventDefault?: () => void;
    }) => {
      const pressedKey = event.key?.toLowerCase();
      if (!pressedKey) {
        return;
      }

      const mappedOption = KEY_TO_OPTION[pressedKey];
      if (!mappedOption) {
        return;
      }

      event.preventDefault?.();
      handleAnswer(mappedOption);
    };

    eventTarget.addEventListener("keydown", onKeyDown);
    return () => {
      eventTarget.removeEventListener?.("keydown", onKeyDown);
    };
  }, [handleAnswer, stage]);

  const handleBookCodeChange = (value: string) => {
    const nextBookCode = value.replace(/\D/g, "").slice(0, 3);

    setBookCodeInput(nextBookCode);
    setEntryError("");

    if (nextBookCode.length === 3) {
      setTimeout(() => programNumberInputRef.current?.focus(), 0);
    }
  };

  const handleProgramNumberChange = (value: string) => {
    const nextProgramNumber = value.replace(/\D/g, "").slice(0, 1);

    setProgramNumberInput(nextProgramNumber);

    if (!nextProgramNumber || /^[1-5]$/.test(nextProgramNumber)) {
      setEntryError("");
      return;
    }

    setEntryError("Programa invalido. Digite um numero de 1 a 5.");
  };

  const startBook = () => {
    const { normalizedCode, answerKey } = getBookAnswerKey(bookCodeInput);
    const selectedProgramNumber = Number(programNumberInput);

    if (!normalizedCode) {
      return;
    }

    if (!/^[1-5]$/.test(programNumberInput)) {
      setEntryError("Programa invalido. Digite um numero de 1 a 5.");
      programNumberInputRef.current?.focus();
      return;
    }

    if (!answerKey) {
      setEntryError("Livro nao encontrado, digite novamente!");
      return;
    }

    const allQuestionNumbers = PROGRAM_KEYS.flatMap((programKey) =>
      answerKey[programKey].map((item) => item.questao),
    );

    setEntryError("");
    setActiveBookCode(normalizedCode);
    setActiveAnswerKey(answerKey);
    setStage("RUNNING");
    setProgramNumber(selectedProgramNumber);
    setQuestionNumber(1);
    setAttemptNumber(1);
    setProgramScore(0);
    setTotalScore(0);
    setProgramResults([]);
    setFeedback("");
    setFinalProgramQuestions(
      buildFinalProgramQuestions(normalizedCode, allQuestionNumbers),
    );
  };

  const startNextProgram = () => {
    const nextProgramNumber = programNumber + 1;

    setProgramNumber(nextProgramNumber);
    setQuestionNumber(1);
    setAttemptNumber(1);
    setProgramScore(0);
    setFeedback("");
    setStage("RUNNING");
  };

  const changeBookCode = () => {
    setStage("ENTRY");
    setActiveBookCode("");
    setActiveAnswerKey(null);
    setBookCodeInput("");
    setProgramNumberInput("");
    setEntryError("");
    setProgramNumber(1);
    setQuestionNumber(1);
    setAttemptNumber(1);
    setProgramScore(0);
    setTotalScore(0);
    setProgramResults([]);
    setFeedback("");
    setFinalProgramQuestions([]);
  };

  const renderAnswerPanel = () => {
    if (stage !== "RUNNING") {
      return null;
    }

    return (
      <View style={styles.answerPanel}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonA]}
            onPress={() => handleAnswer("A")}
            activeOpacity={0.8}
          >
            <Text style={styles.answerText}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonB]}
            onPress={() => handleAnswer("B")}
            activeOpacity={0.8}
          >
            <Text style={[styles.answerText, styles.answerTextDark]}>B</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonC]}
            onPress={() => handleAnswer("C")}
            activeOpacity={0.8}
          >
            <Text style={styles.answerText}>C</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonD]}
            onPress={() => handleAnswer("D")}
            activeOpacity={0.8}
          >
            <Text style={styles.answerText}>D</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.deviceShell}>
        <View style={styles.brandBar}>
          <Text style={styles.brandName}>PENSE BEM</Text>
          <View style={styles.speaker}>
            <View style={styles.speakerDot} />
            <View style={styles.speakerDot} />
            <View style={styles.speakerDot} />
            <View style={styles.speakerDot} />
          </View>
        </View>

        {stage === "ENTRY" ? (
          <View style={styles.entryCard}>
            <Text style={styles.title}>Digite livro e programa</Text>
            <Text style={styles.subtitle}>Programa permitido: 1 a 5.</Text>
            <TextInput
              style={styles.input}
              placeholder="Livro: 081"
              placeholderTextColor="#66744D"
              value={bookCodeInput}
              onChangeText={handleBookCodeChange}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => programNumberInputRef.current?.focus()}
              autoCorrect={false}
              maxLength={3}
            />
            <TextInput
              ref={programNumberInputRef}
              style={styles.input}
              placeholder="Programa: 1"
              placeholderTextColor="#66744D"
              value={programNumberInput}
              onChangeText={handleProgramNumberChange}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={startBook}
              autoCorrect={false}
              maxLength={1}
            />
            {entryError ? (
              <Text style={styles.entryError}>{entryError}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.enterButton}
              onPress={startBook}
              activeOpacity={0.8}
            >
              <Text style={styles.enterButtonText}>Enter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.displayCard}>
              <Text style={styles.displayMeta}>Livro {activeBookCode}</Text>
              <Text style={styles.displayMeta}>
                Programa {String(programNumber).padStart(3, "0")}
              </Text>
              <DigitalNumber value={String(questionNumber).padStart(2, "0")} />
              <Text style={styles.displayMeta}>
                Pergunta do livro: {String(currentQuestionKey).padStart(3, "0")}
              </Text>
              <Text style={styles.displayMeta}>
                Tentativa {attemptNumber}/{MAX_ATTEMPTS}
              </Text>
              <Text style={styles.displayMeta}>Teclas: Q=A, W=B, A=C, S=D</Text>
            </View>

            {renderAnswerPanel()}

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

            {(stage === "PROGRAM_END" || stage === "BOOK_END") && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  Resumo do programa {String(programNumber).padStart(3, "0")}
                </Text>
                <Text style={styles.summaryText}>
                  Pontos neste programa: {programScore}
                </Text>
                <Text style={styles.summaryText}>
                  Pontos totais no livro: {totalScore}
                </Text>

                {stage === "PROGRAM_END" ? (
                  <TouchableOpacity
                    style={styles.nextProgramButton}
                    onPress={startNextProgram}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.nextProgramButtonText}>
                      {programNumber < REGULAR_PROGRAMS
                        ? `Iniciar programa ${String(programNumber + 1).padStart(3, "0")}`
                        : "Iniciar programa 006"}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {stage === "BOOK_END" ? (
                  <View style={styles.resultsBlock}>
                    <Text style={styles.summaryTitle}>Resultado final</Text>
                    {programResults.map((result) => (
                      <Text key={result.programNumber} style={styles.summaryText}>
                        Programa {String(result.programNumber).padStart(3, "0")}:{" "}
                        {result.score} ponto(s)
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              style={styles.changeBookButton}
              onPress={changeBookCode}
              activeOpacity={0.8}
            >
              <Text style={styles.changeBookButtonText}>
                Trocar codigo do livro
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#857A6C",
    padding: 14,
    justifyContent: "center",
  },
  deviceShell: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "#D8D1BE",
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#5B554E",
    padding: 18,
    gap: 14,
    shadowColor: "#2A2723",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  brandBar: {
    backgroundColor: "#BBB4A3",
    borderColor: "#7B756C",
    borderRadius: 4,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandName: {
    color: "#3A3935",
    fontSize: 22,
    fontWeight: "900",
  },
  speaker: {
    flexDirection: "row",
    gap: 5,
  },
  speakerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#686258",
  },
  entryCard: {
    backgroundColor: "#080405",
    borderRadius: 6,
    borderWidth: 5,
    borderColor: "#2A2A2A",
    padding: 18,
    gap: 12,
  },
  title: {
    color: "#FF273C",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "monospace",
    textShadowColor: "#B00018",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: "#C01D2B",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  entryError: {
    color: "#FF6B76",
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  input: {
    backgroundColor: "#120507",
    color: "#FF273C",
    borderRadius: 4,
    borderWidth: 3,
    borderColor: "#3B1116",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "monospace",
    textShadowColor: "#B00018",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  enterButton: {
    backgroundColor: "#2F3130",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#111111",
    paddingVertical: 14,
    alignItems: "center",
  },
  enterButtonText: {
    color: "#F3EBDD",
    fontSize: 16,
    fontWeight: "900",
  },
  displayCard: {
    backgroundColor: "#080405",
    borderRadius: 6,
    borderWidth: 5,
    borderColor: "#2A2A2A",
    padding: 18,
    gap: 6,
  },
  displayMeta: {
    color: "#D62031",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "monospace",
    textShadowColor: "#9A0013",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  digitalNumber: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  digitalDigit: {
    width: 40,
    height: 64,
    position: "relative",
  },
  digitalSegment: {
    position: "absolute",
    backgroundColor: "#26070A",
    borderRadius: 3,
  },
  digitalSegmentActive: {
    backgroundColor: "#FF1E35",
    shadowColor: "#E0001F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  segmentHorizontal: {
    width: 30,
    height: 7,
    left: 5,
  },
  segmentVertical: {
    width: 7,
    height: 24,
  },
  segmentTop: {
    top: 0,
  },
  segmentMiddle: {
    top: 29,
  },
  segmentBottom: {
    bottom: 0,
  },
  segmentUpperLeft: {
    left: 0,
    top: 6,
  },
  segmentUpperRight: {
    right: 0,
    top: 6,
  },
  segmentLowerLeft: {
    left: 0,
    bottom: 6,
  },
  segmentLowerRight: {
    right: 0,
    bottom: 6,
  },
  answerPanel: {
    backgroundColor: "#A59D8E",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#6F675C",
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  answerButton: {
    flex: 1,
    height: 76,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#2E2B27",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonA: {
    backgroundColor: "#E53935",
  },
  buttonB: {
    backgroundColor: "#FDD835",
  },
  buttonC: {
    backgroundColor: "#1E88E5",
  },
  buttonD: {
    backgroundColor: "#43A047",
  },
  answerText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },
  answerTextDark: {
    color: "#111111",
  },
  feedback: {
    color: "#292823",
    backgroundColor: "#EFE7D3",
    borderColor: "#8E8678",
    borderRadius: 5,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#EFE7D3",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#8E8678",
    padding: 14,
    gap: 8,
  },
  summaryTitle: {
    color: "#2F302B",
    fontSize: 16,
    fontWeight: "900",
  },
  summaryText: {
    color: "#424037",
    fontSize: 14,
    fontWeight: "700",
  },
  nextProgramButton: {
    marginTop: 10,
    backgroundColor: "#2F3130",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#111111",
    paddingVertical: 12,
    alignItems: "center",
  },
  nextProgramButtonText: {
    color: "#F3EBDD",
    fontSize: 14,
    fontWeight: "900",
  },
  resultsBlock: {
    marginTop: 8,
    gap: 4,
  },
  changeBookButton: {
    backgroundColor: "#6D675E",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#47423C",
    paddingVertical: 12,
    alignItems: "center",
  },
  changeBookButtonText: {
    color: "#F3EBDD",
    fontSize: 14,
    fontWeight: "900",
  },
});
