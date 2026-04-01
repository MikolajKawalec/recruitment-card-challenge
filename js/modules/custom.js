export default function () {
	// regex patters taken from: https://stackoverflow.com/questions/72768/how-do-you-detect-credit-card-type-based-on-number
	const cardTypes = [
		{
			name: "visa",
			pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
			logo_src: "./images/visa.png",
		},
		{
			name: "mastercard",
			pattern:
				/^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
			logo_src: "./images/mastercard.png",
		},
	];

	// In the demo there is a "Discover" card that is missing from the card images which I have presumed to be the default type so instead I will show visa logo for the other case
	const defaultCard = { name: "other", logo_src: "./images/visa.png" };

	let cardState = {
		card_number: "#".repeat(16),
		card_number_hashed:
			"#".repeat(4) +
			" " +
			"#".repeat(4) +
			" " +
			"#".repeat(4) +
			" " +
			"#".repeat(4),
		card_name: "JAN KOWALSKI",
		card_expiration_month: "MM",
		card_expiration_year: "YY",
		card_cvv: "",
	};

	// js makes things to be strings since I do not get types(TS) I will deal with strings
	// tracking of focsued field and cardside in js is redudant because I use SCSS for this purpose if no further js work, it should be deleted
	let uiState = {
		focusedField: "",
		cardSide: "front",
		cardType: defaultCard.name,
		cardLogoSrc: defaultCard.logo_src,
	};

	const form = document.getElementById("form_card");
	if (!form) {
		console.error("Form element not found");
		return;
	}

	initCardPreview();

	form.addEventListener("focusin", (e) => {
		uiState.focusedField = e.target.name;

		if (uiState.focusedField === "card_cvv") {
			uiState.cardSide = "back";
		} else {
			uiState.cardSide = "front";
		}

		updateCardUI();
	});

	form.addEventListener("input", (e) => {
		const fieldName = e.target.name;
		let rawValue = e.target.value;

		if (fieldName === "card_number") {
			// hardcap 16 max len card string
			rawValue = rawValue.replace(/\D/g, "").substring(0, 16);

			const regex = /(.{4})(?=.)/g;
			let cardNumberDisplayValue = rawValue.replace(regex, "$1 ");
			e.target.value = cardNumberDisplayValue;

			const padded = rawValue.padEnd(16, "#");
			cardState.card_number_hashed = padded.replace(regex, "$1 ");

			const detectedCard = detectCardType(rawValue);
			uiState.cardType = detectedCard.name;
			uiState.cardLogoSrc = detectedCard.logo_src;
			updateCardUI();
		} else if (fieldName === "card_cvv") {
			// hardcap 4 max len cvv string
			rawValue = rawValue.replace(/\D/g, "").substring(0, 4);
			e.target.value = rawValue;
		}

		if (fieldName) {
			cardState[fieldName] = rawValue;
		}

		// there needs to be specials cases due to formating of card number "22224444"-> "2222 4444"

		updateCardValues();
	});

	function initCardPreview() {
		const cardNumberDisplay = document.getElementById("card_number_display");
		const cardNameDisplay = document.getElementById("card_name_display");

		cardNumberDisplay.dataset.prevAnimatedValue = cardState.card_number_hashed;
		cardNameDisplay.dataset.prevAnimatedValue =
			cardState.card_name.toUpperCase();

		updateCardValues();
		updateCardUI();
	}

	function updateCardValues() {
		const cardNumberDisplay = document.getElementById("card_number_display");
		const cardNameDisplay = document.getElementById("card_name_display");
		const cardExpirationMonthDisplay = document.getElementById(
			"card_expiration_month_display",
		);
		const cardExpirationYearDisplay = document.getElementById(
			"card_expiration_year_display",
		);
		const cardCVVDisplay = document.getElementById("card_cvv_display");

		updateAnimatedText(
			cardNumberDisplay,
			cardState.card_number_hashed,
			"char--changed-number",
		);

		updateAnimatedText(
			cardNameDisplay,
			(cardState.card_name || "").trim() || "JAN KOWALSKI",
			"char--changed-name",
		);

		animateValue(
			cardExpirationMonthDisplay,
			cardState.card_expiration_month || "MM",
			"card__expiration-part--changed",
		);

		animateValue(
			cardExpirationYearDisplay,
			cardState.card_expiration_year.substring(2, 4) || "YY",
			"card__expiration-part--changed",
		);

		cardCVVDisplay.textContent = cardState.card_cvv || "\u00A0";
	}

	function updateCardUI() {
		// image swap logic
		const logos = document.querySelectorAll(".card__logo");
		logos.forEach((logoContainer) => {
			const logo = logoContainer.querySelector("img");
			if (logo && logo.getAttribute("src") !== uiState.cardLogoSrc) {
				logo.src = uiState.cardLogoSrc;

				const isGrey = logoContainer.classList.contains("card__logo--grey");

				logoContainer.classList.remove("card__logo--changed");
				void logoContainer.offsetWidth;
				logoContainer.classList.add("card__logo--changed");

				if (isGrey) {
					logoContainer.classList.add("card__logo--grey");
				}
			}
		});
	}

	function detectCardType(number) {
		const match = cardTypes.find((card) => card.pattern.test(number));
		return match ? match : defaultCard;
	}

	function updateAnimatedText(container, newValue, animationClass) {
		const prevValue = container.dataset.prevAnimatedValue || "";
		const newChars = newValue.split("");
		const prevChars = prevValue.split("");

		if (container.children.length !== newChars.length) {
			container.innerHTML = "";
			newChars.forEach((char) => {
				const span = document.createElement("span");
				span.className = char === " " ? "space" : "char";
				span.textContent = char === " " ? "\u00A0" : char; // whitespace character; ensures that objects arent empty and have height
				container.appendChild(span);
			});
		}

		newChars.forEach((char, i) => {
			if (char === " ") return;

			const el = container.children[i];
			if (!el) return;

			if (prevChars[i] !== char) {
				el.textContent = char;
				el.classList.remove(animationClass);
				void el.offsetWidth;
				el.classList.add(animationClass);
			}
		});

		container.dataset.prevAnimatedValue = newValue;
	}

	function animateValue(element, value, animationClass) {
		if (!element) return;

		if (element.textContent !== value) {
			element.textContent = value;
			element.classList.remove(animationClass);
			void element.offsetWidth;
			element.classList.add(animationClass);
		}
	}
}
