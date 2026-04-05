export const LEVEL_1_PUZZLES = [
    {
        sequence: [2, 4, 8, '?', 32],
        options: [12, 14, 16, 18],
        correctAnswer: 16,
        description: "Find the missing number in the power of 2 sequence."
    },
    {
        sequence: [1, 1, 2, 3, 5, '?', 13],
        options: [6, 7, 8, 9],
        correctAnswer: 8,
        description: "Identify the next number in the Fibonacci sequence."
    },
    {
        sequence: [1, 4, 9, 16, '?', 36],
        options: [20, 24, 25, 30],
        correctAnswer: 25,
        description: "Calculate the missing square number."
    },
    {
        sequence: [3, 6, 12, 24, '?', 96],
        options: [36, 42, 48, 54],
        correctAnswer: 48,
        description: "Find the next number in the doubling sequence."
    },
    {
        sequence: [100, 90, 81, 73, '?', 60],
        options: [64, 65, 66, 67],
        correctAnswer: 66,
        description: "Identify the pattern of decreasing differences (-10, -9, -8, -7...)."
    }
];

export const LEVEL_2_PUZZLES = [
    {
        question: "Five people (A, B, C, D, E) are in a race.\nA finished before B but after C.\nD finished before E but after B.\nWho won the race?",
        options: [
            { id: 'A', label: 'Person A' },
            { id: 'B', label: 'Person B' },
            { id: 'C', label: 'Person C' },
            { id: 'D', label: 'Person D' }
        ],
        correctAnswer: 'C',
        description: "Logic Race: Determine the winner based on relative finishing positions."
    },
    {
        question: "Alice is taller than Bob.\nCharlie is shorter than Alice but taller than Bob.\nDavid is taller than Alice.\nWho is the tallest?",
        options: [
            { id: 'Alice', label: 'Alice' },
            { id: 'Bob', label: 'Bob' },
            { id: 'Charlie', label: 'Charlie' },
            { id: 'David', label: 'David' }
        ],
        correctAnswer: 'David',
        description: "Height Comparison: Use the statements to find the tallest person."
    },
    {
        question: "There are 4 boxes: Red, Blue, Green, Yellow.\nThe gold is not in the Red or Blue box.\nThe gold is in the Green box IF the Yellow box is empty.\nThe Yellow box is NOT empty.\nWhere is the gold?",
        options: [
            { id: 'Red', label: 'Red Box' },
            { id: 'Blue', label: 'Blue Box' },
            { id: 'Green', label: 'Green Box' },
            { id: 'Yellow', label: 'Yellow Box' }
        ],
        correctAnswer: 'Yellow',
        description: "Hidden Object Logic: Deduce the location of the gold."
    },
    {
        question: "In a family, Sam is older than Max.\nLeo is younger than Sam but older than Max.\nMax is older than Toby.\nWho is the youngest?",
        options: [
            { id: 'Sam', label: 'Sam' },
            { id: 'Max', label: 'Max' },
            { id: 'Leo', label: 'Leo' },
            { id: 'Toby', label: 'Toby' }
        ],
        correctAnswer: 'Toby',
        description: "Age Hierarchy: Identify the youngest family member."
    }
];

export const LEVEL_3_PUZZLES = [
    {
        items: ['🔴 Red', '🟢 Green', '🔵 Blue'],
        rules: [
            "1. Red is immediately to the left of Blue.",
            "2. Green is NOT in the last position."
        ],
        validate: (slots) => {
            const redIndex = slots.findIndex(s => s.includes('Red'));
            const blueIndex = slots.findIndex(s => s.includes('Blue'));
            const greenIndex = slots.findIndex(s => s.includes('Green'));
            if (blueIndex - redIndex !== 1) return { valid: false, message: "Red must be immediately to the left of Blue." };
            if (greenIndex === 2) return { valid: false, message: "Green cannot be in the last position." };
            return { valid: true };
        },
        description: "RGB Ordering: Arrange colors following position constraints."
    },
    {
        items: ['🍎 Apple', '🍌 Banana', '🍒 Cherry'],
        rules: [
            "1. Banana must be in the middle (Slot 2).",
            "2. Apple cannot be in Slot 1."
        ],
        validate: (slots) => {
            if (!slots[1].includes('Banana')) return { valid: false, message: "Banana must be in the middle." };
            if (slots[0].includes('Apple')) return { valid: false, message: "Apple cannot be in Slot 1." };
            return { valid: true };
        },
        description: "Fruit Sorting: Place fruits in their correct slots."
    },
    {
        items: ['🐱 Cat', '🐶 Dog', '🐦 Bird'],
        rules: [
            "1. The Bird must be between the Cat and the Dog.",
            "2. The Dog cannot be in Slot 3."
        ],
        validate: (slots) => {
            const birdIndex = slots.findIndex(s => s.includes('Bird'));
            const dogIndex = slots.findIndex(s => s.includes('Dog'));
            if (birdIndex !== 1) return { valid: false, message: "Bird must be in the middle slot." };
            if (dogIndex === 2) return { valid: false, message: "Dog cannot be in the last slot." };
            return { valid: true };
        },
        description: "Pet Alignment: Arrange pets based on adjacency rules."
    }
];
