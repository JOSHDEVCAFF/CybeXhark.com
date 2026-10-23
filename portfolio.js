function getProjectsPerPage() {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
}

const collections = {
    activities: [
        {
            image: 'Act1.png',
            driveUrl: 'https://drive.google.com/file/d/1ocefG_FeGA7UGpdoaFHyt11ciuxOG3XK/view?usp=sharing'
        },
        {
            image: 'Act2.png',
            driveUrl: 'https://drive.google.com/file/d/1ylR3DegsRI0qP3qdCiqHG5gUcdtu9rSp/view?usp=sharing'
        },
        {
            image: 'Act3.png',
            driveUrl: 'https://drive.google.com/file/d/1rfSWbDPEGJiHjG2fv9Xk-adAkNZpZHWE/view?usp=drive_link'
        },
        {
            image: 'Act4.png',
            driveUrl: 'https://drive.google.com/file/d/1Ndfm5896-cEdRL_g9_j7d-IPlDk2iJA6/view?usp=drive_link'
        }
    ],
    exercises: [
        {
            image: 'exe1.png',
            driveUrl: 'https://drive.google.com/file/d/1Eo8KcYCdaQ3DlGZbACEWU2swjJNdyQvO/view?usp=sharing'
        },
        {
            image: 'exe2.png',
            driveUrl: 'https://drive.google.com/file/d/1NunKiB4YC2UZE2otpir8gJDiSdZ_lKOb/view?usp=sharing'
        },
        {
            image: 'exe3.png',
            driveUrl: 'https://drive.google.com/file/d/1wLjf5QtEHU4y9MsZwiZ9cCUCoCz5Rkg5/view?usp=sharing'
        },
        {
            image: 'exe4.png',
            driveUrl: 'https://drive.google.com/file/d/1rR8PP9WKYXV-dcO33fT22WhRkuuOFnka/view?usp=sharing'
        },
        {
            image: 'exe5.png',
            driveUrl: 'https://drive.google.com/file/d/1-89zNNRQpFfFHTU7uN_sZ_I4b1fcxyEy/view?usp=sharing'
        },
        {
            image: 'exe6.png',
            driveUrl: 'https://drive.google.com/file/d/1RiVee51fx5MmyapqcfNalRjBXJqxzJbB/view?usp=sharing'
        },
        {
            image: 'exe7.png',
            driveUrl: 'https://drive.google.com/file/d/1ezmnhlSHR1kxCslYCIfd40NkpsFR1G3O/view?usp=sharing'
        },
        {
            image: 'exe8.png',
            driveUrl: 'https://drive.google.com/file/d/19J79rPqg_OVCdXlnnw-igM8j1S6bXcJi/view?usp=sharing'
        }
    ]
};
const pageByCollection = { activities: 0, exercises: 0 };
let projectsPerPage = getProjectsPerPage();

function renderCollection(name) {
    const projects = collections[name];
    const grid = document.getElementById(`${name}Grid`);
    const emptyMessage = document.getElementById(`${name}Empty`);
    const pageLabel = document.getElementById(`${name}Page`);
    const start = pageByCollection[name] * projectsPerPage;
    const pageCount = Math.ceil(projects.length / projectsPerPage);

    grid.replaceChildren();
    projects.slice(start, start + projectsPerPage).forEach((project, index) => {
        const card = document.createElement('article');
        card.className = 'project-card';

        const image = document.createElement('img');
        image.src = project.image;
        image.alt = `${name === 'activities' ? 'Activity' : 'Exercise'} project preview ${start + index + 1}`;
        image.loading = 'lazy';
        image.decoding = 'async';

        const actions = document.createElement('div');
        actions.className = 'project-card-actions';
        const hasDriveUrl = Boolean(project.driveUrl);
        const link = document.createElement(hasDriveUrl ? 'a' : 'button');
        link.className = 'drive-link';
        link.textContent = hasDriveUrl ? 'View project code' : 'Add Google Drive link';
        if (project.driveUrl) {
            link.href = project.driveUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        } else {
            link.type = 'button';
            link.disabled = true;
        }
        actions.appendChild(link);
        card.append(image, actions);
        grid.appendChild(card);
    });

    emptyMessage.hidden = projects.length > 0;
    pageLabel.textContent = pageCount ? `${pageByCollection[name] + 1} / ${pageCount}` : '0 projects';
    document.querySelectorAll(`[data-collection="${name}"]`).forEach((button) => {
        const direction = Number(button.dataset.direction);
        button.disabled = pageCount === 0 ||
            (direction < 0 && pageByCollection[name] === 0) ||
            (direction > 0 && pageByCollection[name] >= pageCount - 1);
    });
}

document.querySelectorAll('.pagination button').forEach((button) => {
    button.addEventListener('click', () => {
        const name = button.dataset.collection;
        const pageCount = Math.ceil(collections[name].length / projectsPerPage);
        pageByCollection[name] = Math.max(
            0,
            Math.min(pageCount - 1, pageByCollection[name] + Number(button.dataset.direction))
        );
        renderCollection(name);
    });
});

window.addEventListener('resize', () => {
    const nextProjectsPerPage = getProjectsPerPage();
    if (nextProjectsPerPage === projectsPerPage) return;

    Object.keys(collections).forEach((name) => {
        const firstVisibleProject = pageByCollection[name] * projectsPerPage;
        const nextPageCount = Math.ceil(collections[name].length / nextProjectsPerPage);
        pageByCollection[name] = Math.min(
            Math.floor(firstVisibleProject / nextProjectsPerPage),
            Math.max(0, nextPageCount - 1)
        );
    });
    projectsPerPage = nextProjectsPerPage;
    Object.keys(collections).forEach(renderCollection);
});

Object.keys(collections).forEach(renderCollection);
