// ==============================
// LOGIN
// ==============================

async function login() {

    const email =
        document
        .getElementById("email")
        .value;

    const password =
        document
        .getElementById("password")
        .value;


    const message =
        document
        .getElementById("loginMessage");


    message.innerText =
        "Logging in...";


    const { data, error } =
        await supabaseClient.auth
        .signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        message.innerText =
            error.message;

        return;

    }


    // CHECK ADMIN

    const { data: adminData, error: adminError } =
        await supabaseClient
        .from("admin_roles")
        .select("*")
        .eq(
            "user_id",
            data.user.id
        )
        .single();


    if (adminError || !adminData) {

        await supabaseClient.auth.signOut();

        message.innerText =
            "You are not an admin.";

        return;

    }


    showDashboard();

}


// ==============================
// SHOW DASHBOARD
// ==============================

function showDashboard() {

    document
        .getElementById("loginPage")
        .style.display =
        "none";


    document
        .getElementById("dashboard")
        .style.display =
        "flex";


    loadUsers();

}


// ==============================
// CHECK LOGIN ON PAGE LOAD
// ==============================

async function checkUser() {

    const { data } =
        await supabaseClient.auth
        .getSession();


    if (!data.session) {

        return;

    }


    const user =
        data.session.user;


    const { data: adminData } =
        await supabaseClient
        .from("admin_roles")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .single();


    if (adminData) {

        showDashboard();

    }

}


checkUser();


// ==============================
// LOGOUT
// ==============================

async function logout() {

    await supabaseClient.auth.signOut();

    location.reload();

}


// ==============================
// ADD PROJECT FIELD
// ==============================

function addProject() {

    const container =
        document
        .getElementById(
            "projectsContainer"
        );


    const project =
        document.createElement("div");


    project.className =
        "project-item";


    project.innerHTML = `

        <input
            type="text"
            class="project-name"
            placeholder="Project Name"
        >

        <textarea
            class="project-description"
            placeholder="Project Description"
        ></textarea>

        <button
            type="button"
            class="remove-project"
        >
            Remove
        </button>

    `;


    project
        .querySelector(
            ".remove-project"
        )
        .addEventListener(
            "click",
            function () {

                project.remove();

            }
        );


    container.appendChild(project);

}


// ==============================
// UPLOAD PROFILE PICTURE
// ==============================

async function uploadProfilePicture(
    file,
    artistId
) {

    if (!file) {

        return null;

    }


    const extension =
        file.name
        .split(".")
        .pop();


    const fileName =
        `${artistId}-${Date.now()}.${extension}`;


    const filePath =
        `profiles/${fileName}`;


    const { error } =
        await supabaseClient
        .storage
        .from("profiles")
        .upload(
            filePath,
            file
        );


    if (error) {

        throw error;

    }


    const { data } =
        supabaseClient
        .storage
        .from("profiles")
        .getPublicUrl(
            filePath
        );


    return data.publicUrl;

}


// ==============================
// CREATE DIGITAL ID
// ==============================

document
.getElementById("userForm")
.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const message =
            document
            .getElementById("message");


        message.innerText =
            "Creating Digital ID...";


        try {


            const name =
                document
                .getElementById("name")
                .value;


            const artistId =
                document
                .getElementById("artistId")
                .value;


            const voiceType =
                document
                .getElementById("voiceType")
                .value;


            const language =
                document
                .getElementById("language")
                .value;


            // CREATE SLUG

            const slug =
                name
                .toLowerCase()
                .trim()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-|-$/g,
                    ""
                );


            // PROFILE IMAGE

            const file =
                document
                .getElementById(
                    "profilePicture"
                )
                .files[0];


            const profilePictureUrl =
                await uploadProfilePicture(
                    file,
                    artistId
                );


            // SOCIAL MEDIA

            const socialMedia = {

                instagram:
                    document
                    .getElementById(
                        "instagram"
                    )
                    .value,

                youtube:
                    document
                    .getElementById(
                        "youtube"
                    )
                    .value,

                facebook:
                    document
                    .getElementById(
                        "facebook"
                    )
                    .value

            };


            // PROJECTS

            const projectElements =
                document.querySelectorAll(
                    ".project-item"
                );


            const projects = [];


            projectElements.forEach(
                function (project) {

                    const projectName =
                        project
                        .querySelector(
                            ".project-name"
                        )
                        .value;


                    const description =
                        project
                        .querySelector(
                            ".project-description"
                        )
                        .value;


                    if (projectName) {

                        projects.push({

                            name:
                                projectName,

                            description:
                                description

                        });

                    }

                }
            );


            // INSERT DATABASE

            const { error } =
                await supabaseClient
                .from("digital_ids")
                .insert({

                    artist_id:
                        artistId,

                    slug:
                        slug,

                    name:
                        name,

                    profile_picture_url:
                        profilePictureUrl,

                    voice_type:
                        voiceType,

                    language:
                        language,

                    social_media:
                        socialMedia,

                    projects:
                        projects

                });


            if (error) {

                throw error;

            }


            message.innerHTML = `

                ✅ Digital ID Created Successfully!

                <br><br>

                User URL:

                <a
                    href="user.html?user=${slug}"
                    target="_blank"
                >

                    Open Digital ID

                </a>

            `;


            document
            .getElementById("userForm")
            .reset();


            document
            .getElementById(
                "projectsContainer"
            )
            .innerHTML = "";


            loadUsers();


        }

        catch (error) {

            console.error(error);

            message.innerText =
                "Error: " +
                error.message;

        }

    }
);


// ==============================
// LOAD USERS
// ==============================

async function loadUsers() {

    const usersList =
        document
        .getElementById(
            "usersList"
        );


    usersList.innerHTML =
        "Loading...";


    const { data, error } =
        await supabaseClient
        .from("digital_ids")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        usersList.innerHTML =
            error.message;

        return;

    }


    usersList.innerHTML = "";


    data.forEach(
        function (user) {

            const div =
                document.createElement("div");


            div.className =
                "user-card";


            div.innerHTML = `

                <div>

                    <strong>

                        ${user.name}

                    </strong>

                    <br>

                    ${user.artist_id}

                    <br>

                    ${user.voice_type}

                </div>


                <a
                    href="user.html?user=${user.slug}"
                    target="_blank"
                >

                    View Digital ID

                </a>

            `;


            usersList.appendChild(div);

        }
    );

}


// ==============================
// SWITCH SECTIONS
// ==============================

function showCreateUser() {

    document
        .getElementById(
            "createUserSection"
        )
        .style.display =
        "block";


    document
        .getElementById(
            "usersSection"
        )
        .style.display =
        "none";

}
