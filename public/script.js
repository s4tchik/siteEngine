document.addEventListener('DOMContentLoaded', () => {
    // Селекторы DOM-элементов
    const lessonContainer = document.querySelector('.lesson-container');
    const lessonModal = document.getElementById('lessonModal');
    const adminAnswersModal = document.getElementById('adminAnswersModal');
    const editLessonModal = document.getElementById('editLessonModal');
    const profileModal = document.getElementById('profileModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const aboutUsModal = document.getElementById('aboutUsModal');
    const ourCompanyModal = document.getElementById('ourCompanyModal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const toggleAdminModeButton = document.getElementById('toggleAdminMode');
    const toggleAdminFeaturesButton = document.getElementById('toggleAdminFeatures'); // Новая кнопка
    const resetProgressButton = document.getElementById('resetProgressButton');
    const viewAnswersButton = document.getElementById('viewAnswersButton');
    const profileLink = document.getElementById('profileLink');
    const aboutUsLink = document.getElementById('aboutUsLink');
    const ourCompanyLink = document.getElementById('ourCompanyLink');
    const notification = document.getElementById('notification');
    // Данные для уроков (загружаются из JSON)
    let lessonsData = [];
    let isAdminMode = false;
    let isAdminFeaturesVisible = false; // Флаг для видимости функционала админа
    // Данные профиля
    let profileData = {
        firstName: 'Иван',
        lastName: 'Иванов',
        about: 'Здесь может быть информация о вас.',
        picture: 'default-avatar.png',
    };

    // Загрузка данных с сервера
    async function loadLessons() {
        try {
            const response = await fetch('/api/lessons');
            lessonsData = await response.json();
            renderLessons();
            updateProfileProgress();
        } catch (error) {
            console.error('Ошибка при загрузке уроков:', error);
        }
    }

    // Отображение кнопок уроков
    function renderLessons() {
        lessonContainer.innerHTML = '';
        lessonsData.forEach((lesson, index) => {
            const button = document.createElement('button');
            button.classList.add('lesson-button');
            button.textContent = `Урок ${index + 1}`;
            button.dataset.lesson = index + 1;
            if (isAdminMode || index === 0 || lessonsData[index - 1]?.completed) {
                button.classList.add('active');
            } else {
                button.classList.add('locked');
                button.disabled = true;
            }
            if (isAdminMode) {
                button.addEventListener('click', () => openEditLesson(index));
            } else {
                button.addEventListener('click', () => openLesson(index));
            }
            lessonContainer.appendChild(button);
        });
        checkVisibility();
    }

    // Проверка видимости кнопок при прокрутке
    function checkVisibility() {
        const buttons = document.querySelectorAll('.lesson-button');
        buttons.forEach(button => {
            if (isElementInViewport(button)) {
                button.classList.add('visible');
            }
        });
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        );
    }

    window.addEventListener('scroll', checkVisibility);

    // Открытие модального окна для просмотра урока
    function openLesson(index) {
        const lesson = lessonsData[index];
        if (!isAdminMode && !lesson.completed && index !== 0 && !lessonsData[index - 1]?.completed) {
            alert('Для просмотра этого урока завершите предыдущий.');
            return;
        }
        document.getElementById('lessonTitle').textContent = lesson.title;
        document.getElementById('lessonDescription').innerHTML = `
            ${convertNewlinesToBr(lesson.description)}<br><br><strong>Задание:</strong> ${convertNewlinesToBr(lesson.task)}
        `;
        const videoLink = document.getElementById('lessonVideoLink');
        if (lesson.videoUrl) {
            videoLink.href = lesson.videoUrl;
            videoLink.style.display = 'block';
        } else {
            videoLink.style.display = 'none';
        }
        // Отображение прикрепленного файла
        const attachedFile = document.getElementById('attachedFile');
        const attachedFileLink = document.getElementById('attachedFileLink');
        if (lesson.filePath) {
            attachedFile.style.display = 'block';
            attachedFileLink.href = lesson.filePath;
        } else {
            attachedFile.style.display = 'none';
        }
        lessonModal.style.display = 'block';
    }

    // Преобразование переносов строк в <br>
    function convertNewlinesToBr(text) {
        return text.replace(/\n/g, '<br>');
    }

    // Закрытие модальных окон
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            lessonModal.style.display = 'none';
            adminAnswersModal.style.display = 'none';
            editLessonModal.style.display = 'none';
            profileModal.style.display = 'none';
            editProfileModal.style.display = 'none';
            aboutUsModal.style.display = 'none';
            ourCompanyModal.style.display = 'none';
        });
    });

    // Логика для кнопки загрузки файла
    document.getElementById('fileUploadButton').addEventListener('click', () => {
        const fileInput = document.getElementById('fileUpload');
        fileInput.click();
    });

    // Обработка выбора файла
    document.getElementById('fileUpload').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Файл не выбран.');
            return;
        }
        const formData = new FormData();
        formData.append('lesson', lessonsData.findIndex(lesson => !lesson.completed) + 1);
        formData.append('file', file);
        try {
            const response = await fetch('/api/complete-lesson', {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                const updatedData = await response.json();
                lessonsData = updatedData.lessons;
                renderLessons();
                showNotification();
                lessonModal.style.display = 'none';
            }
        } catch (error) {
            console.error('Ошибка при отправке данных:', error);
        }
    });

    // Показать уведомление
    function showNotification() {
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }

    // Режим администратора
    toggleAdminModeButton.addEventListener('click', () => {
        isAdminMode = !isAdminMode;
        toggleAdminModeButton.textContent = isAdminMode ? 'Выйти из режима админа' : 'Режим админа';
        toggleAdminFeaturesButton.style.display = isAdminMode ? 'inline-block' : 'none'; // Показываем кнопку "Показать функционал админа"
        resetProgressButton.parentElement.style.display = isAdminMode ? 'block' : 'none'; // Показываем блок с кнопками админа
        isAdminFeaturesVisible = false; // Сбрасываем видимость функционала админа
        renderLessons();
    });

    // Логика для кнопки "Показать функционал админа"
    toggleAdminFeaturesButton.addEventListener('click', () => {
        isAdminFeaturesVisible = !isAdminFeaturesVisible;
        if (isAdminFeaturesVisible) {
            // Показываем модальное окно с функционалом админа
            adminFeaturesModal.style.display = 'block';
            toggleAdminFeaturesButton.textContent = 'Скрыть функционал админа';
        } else {
            // Скрываем модальное окно
            adminFeaturesModal.style.display = 'none';
            toggleAdminFeaturesButton.textContent = 'Показать функционал админа';
        }
    });

    // Логика для кнопки "Обнулить прогресс"
    resetProgressButton.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите обнулить прогресс?')) {
            try {
                const response = await fetch('/api/reset-progress', {
                    method: 'POST',
                });
                if (response.ok) {
                    lessonsData = lessonsData.map(lesson => ({ ...lesson, completed: false, filePath: null }));
                    renderLessons();
                    updateProfileProgress();
                    alert('Прогресс успешно обнулен!');
                }
            } catch (error) {
                console.error('Ошибка при обнулении прогресса:', error);
            }
        }
    });

    // Логика для кнопки "Просмотреть ответы"
    viewAnswersButton.addEventListener('click', () => {
        const answersList = document.getElementById('adminAnswersList');
        answersList.innerHTML = '';
        lessonsData.forEach((lesson, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `Урок ${index + 1}: `;
            if (lesson.filePath) {
                const fileLink = document.createElement('a');
                fileLink.href = lesson.filePath;
                fileLink.textContent = 'Скачать';
                fileLink.target = '_blank';
                listItem.appendChild(fileLink);
            } else {
                listItem.textContent += 'Нет файла';
            }
            answersList.appendChild(listItem);
        });
        // Открываем модальное окно с ответами
        document.getElementById('adminAnswersModal').style.display = 'block';
        // Автоматически скрываем модальное окно с функционалом админа
        adminFeaturesModal.style.display = 'none';
        isAdminFeaturesVisible = false;
        toggleAdminFeaturesButton.textContent = 'Показать функционал админа';
    });

    // Логика для редактирования урока
    function openEditLesson(index) {
        const lesson = lessonsData[index];
        document.getElementById('editLessonTitle').value = lesson.title;
        document.getElementById('editLessonDescription').value = lesson.description;
        document.getElementById('editLessonTask').value = lesson.task || '';
        document.getElementById('editLessonVideoUrl').value = lesson.videoUrl || '';
        editLessonModal.style.display = 'block';
        document.getElementById('saveLessonChanges').onclick = async () => {
            const updatedLesson = {
                title: document.getElementById('editLessonTitle').value,
                description: document.getElementById('editLessonDescription').value,
                task: document.getElementById('editLessonTask').value,
                videoUrl: document.getElementById('editLessonVideoUrl').value,
            };
            try {
                const response = await fetch(`/api/lessons/${index}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedLesson),
                });
                if (response.ok) {
                    lessonsData[index] = updatedLesson;
                    renderLessons();
                    editLessonModal.style.display = 'none';
                }
            } catch (error) {
                console.error('Ошибка при сохранении изменений:', error);
            }
        };
    }

    // Логика для страницы профиля
    profileLink.addEventListener('click', () => {
        loadProfile();
        profileModal.style.display = 'block';
    });

    // Загрузка данных профиля
    function loadProfile() {
        const savedProfile = localStorage.getItem('profileData');
        if (savedProfile) {
            profileData = JSON.parse(savedProfile);
        }
        document.getElementById('profileFirstName').textContent = profileData.firstName;
        document.getElementById('profileLastName').textContent = profileData.lastName;
        document.getElementById('profileAbout').textContent = profileData.about;
        document.getElementById('profilePicture').src = profileData.picture;
        updateProfileProgress();
    }

    // Обновление прогресса в профиле
    function updateProfileProgress() {
        const completedLessons = lessonsData.filter(lesson => lesson.completed).length;
        document.getElementById('profileProgress').textContent = `${completedLessons} / ${lessonsData.length} уроков`;
    }

    // Логика для редактирования профиля
    document.getElementById('editProfileButton').addEventListener('click', () => {
        document.getElementById('editProfileFirstName').value = profileData.firstName;
        document.getElementById('editProfileLastName').value = profileData.lastName;
        document.getElementById('editProfileAbout').value = profileData.about;
        editProfileModal.style.display = 'block';
    });

    document.getElementById('saveProfileChanges').addEventListener('click', () => {
        const firstName = document.getElementById('editProfileFirstName').value;
        const lastName = document.getElementById('editProfileLastName').value;
        const about = document.getElementById('editProfileAbout').value;
        const pictureInput = document.getElementById('editProfilePicture');
        // Обновляем данные профиля
        profileData.firstName = firstName;
        profileData.lastName = lastName;
        profileData.about = about;
        // Обновляем фото профиля, если выбран новый файл
        if (pictureInput.files.length > 0) {
            const file = pictureInput.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                profileData.picture = reader.result;
                saveProfileData();
                loadProfile(); // Перезагружаем профиль с новыми данными
            };
            reader.readAsDataURL(file);
        } else {
            saveProfileData();
            loadProfile(); // Перезагружаем профиль без изменения фото
        }
        // Закрываем модальное окно
        editProfileModal.style.display = 'none';
    });

    // Сохранение данных профиля в localStorage
    function saveProfileData() {
        localStorage.setItem('profileData', JSON.stringify(profileData));
    }

    // Логика для кнопки "О нас"
    aboutUsLink.addEventListener('click', () => {
        aboutUsModal.style.display = 'block';
    });

    // Логика для кнопки "Наша компания"
    ourCompanyLink.addEventListener('click', () => {
        ourCompanyModal.style.display = 'block';
    });

    // Инициализация
    loadLessons();

    // ДОБАВЛЕННЫЕ ЧАСТИ

    // 1. Закрытие модальных окон по клику вне их области
    window.addEventListener('click', event => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // 2. Обработка загрузки фото профиля
    const profilePictureInput = document.getElementById('editProfilePicture');
    const profilePicture = document.getElementById('profilePicture');

    profilePictureInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                profilePicture.src = e.target.result; // Отображаем загруженное изображение
            };
            reader.readAsDataURL(file); // Читаем файл как Data URL
        }
    });

    // 3. Обработка загрузки файла в уроке
    const fileUploadInput = document.getElementById('fileUpload');
    const attachedFileLink = document.getElementById('attachedFileLink');
    const attachedFile = document.getElementById('attachedFile');

    fileUploadInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file); // Создаем временную ссылку на файл
            attachedFileLink.href = url;
            attachedFileLink.textContent = file.name;
            attachedFile.style.display = 'block'; // Показываем блок с файлом
        }
    });
});