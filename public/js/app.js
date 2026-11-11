// ============================================================
// Task Tracker Kuliah — app.js
// ============================================================

const state = {
    tugas: [],
    filter: "semua",
    pencarian: "",
    memuat: true,
    error: ""
};

const ICON = {
    book: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v4M16 3v4M3.5 10h17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5M12 16.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 11h7M8.5 14.5h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
};

const el = {
    form: document.getElementById("form-tugas"),
    judul: document.getElementById("judul"),
    matkul: document.getElementById("matkul"),
    deadline: document.getElementById("deadline"),
    tombolTambah: document.getElementById("tombol-tambah"),
    formError: document.getElementById("form-error"),

    daftar: document.getElementById("daftar-tugas"),
    ringkasan: document.getElementById("ringkasan"),
    pencarian: document.getElementById("pencarian"),
    filter: document.querySelector(".filter"),

    statTotal: document.getElementById("stat-total"),
    statAktif: document.getElementById("stat-aktif"),
    statSelesai: document.getElementById("stat-selesai"),

    modal: document.getElementById("modal-edit"),
    formEdit: document.getElementById("form-edit"),
    editId: document.getElementById("edit-id"),
    editJudul: document.getElementById("edit-judul"),
    editMatkul: document.getElementById("edit-matkul"),
    editDeadline: document.getElementById("edit-deadline"),
    editSelesai: document.getElementById("edit-selesai"),
    editError: document.getElementById("edit-error"),
    tombolSimpan: document.getElementById("simpan-edit"),
    tutupModal: document.getElementById("tutup-modal"),
    batalEdit: document.getElementById("batal-edit"),

    toast: document.getElementById("toast-container")
};

// ============================================================
// Helper
// ============================================================

async function api(path, options = {}) {
    const res = await fetch("/api" + path, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    if (!res.ok) {
        const data = await res.json().catch(function () {
            return {};
        });
        throw new Error(data.message || "Terjadi kesalahan (" + res.status + ")");
    }

    // DELETE membalas 204 tanpa body
    return res.status === 204 ? null : res.json();
}

function esc(value) {
    return String(value).replace(/[&<>"']/g, function (karakter) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[karakter];
    });
}

function formatTanggal(tanggal) {
    const date = new Date(tanggal + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return tanggal;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function statusTugas(item) {
    if (item.selesai) {
        return { label: "Selesai", kelas: "badge--done" };
    }

    const batas = new Date(item.deadline + "T23:59:59");

    if (!Number.isNaN(batas.getTime()) && batas < new Date()) {
        return { label: "Terlambat", kelas: "badge--late" };
    }

    return { label: "Aktif", kelas: "badge--active" };
}

function validasiForm(judul, matkul, deadline) {
    if (judul.length < 3) {
        return "Judul tugas minimal 3 karakter.";
    }

    if (judul.length > 100) {
        return "Judul tugas maksimal 100 karakter.";
    }

    if (!matkul) {
        return "Pilih mata kuliah terlebih dahulu.";
    }

    if (!deadline) {
        return "Deadline wajib diisi.";
    }

    return "";
}

function tampilkanError(elemen, pesan) {
    elemen.textContent = pesan;
    elemen.classList.toggle("is-visible", Boolean(pesan));
}

function setTombolSibuk(tombol, sibuk, teksSibuk, teksNormal) {
    tombol.disabled = sibuk;
    tombol.classList.toggle("is-loading", sibuk);

    const label = tombol.querySelector(".btn__label");

    if (label) {
        label.textContent = sibuk ? teksSibuk : teksNormal;
    }
}

function tampilkanToast(pesan, tipe = "sukses") {
    const toast = document.createElement("div");
    toast.className = "toast toast--" + tipe;
    toast.innerHTML =
        '<span class="toast__icon">' +
        (tipe === "gagal" ? ICON.alert : ICON.check) +
        "</span><p>" +
        esc(pesan) +
        "</p>";

    el.toast.appendChild(toast);

    window.setTimeout(function () {
        toast.classList.add("toast--keluar");
        window.setTimeout(function () {
            toast.remove();
        }, 240);
    }, 3200);
}

// ============================================================
// Memuat data (GET)
// ============================================================

async function muat() {
    state.memuat = true;
    state.error = "";
    render();

    try {
        state.tugas = await api("/tugas");
    } catch (err) {
        state.error = err.message;
    } finally {
        state.memuat = false;
        render();
    }
}

// ============================================================
// Render
// ============================================================

function render() {
    renderStatistik();
    renderDaftar();
}

function renderStatistik() {
    const total = state.tugas.length;
    const selesai = state.tugas.filter(function (item) {
        return item.selesai;
    }).length;
    const aktif = total - selesai;

    el.statTotal.textContent = total;
    el.statAktif.textContent = aktif;
    el.statSelesai.textContent = selesai;

    if (state.memuat) {
        el.ringkasan.textContent = "Memuat data tugas...";
    } else if (state.error) {
        el.ringkasan.textContent = "Data gagal dimuat.";
    } else if (total === 0) {
        el.ringkasan.textContent = "Belum ada tugas tersimpan.";
    } else {
        el.ringkasan.textContent =
            total + " tugas · " + aktif + " aktif · " + selesai + " selesai";
    }
}

function tugasTerfilter() {
    const kata = state.pencarian.trim().toLowerCase();

    return state.tugas.filter(function (item) {
        const cocokStatus =
            state.filter === "semua" ||
            (state.filter === "aktif" ? !item.selesai : item.selesai);

        const cocokKata =
            !kata ||
            item.judul.toLowerCase().includes(kata) ||
            item.matkul.toLowerCase().includes(kata);

        return cocokStatus && cocokKata;
    });
}

function renderDaftar() {
    el.daftar.innerHTML = "";

    if (state.memuat) {
        el.daftar.innerHTML =
            '<li class="skeleton"></li>' +
            '<li class="skeleton"></li>' +
            '<li class="skeleton"></li>';
        return;
    }

    if (state.error) {
        const li = document.createElement("li");
        li.innerHTML =
            '<div class="empty">' +
            '<div class="empty__icon">' + ICON.alert + "</div>" +
            "<h3>Gagal memuat data</h3>" +
            "<p>" + esc(state.error) + "</p>" +
            '<button type="button" class="btn btn--primary btn--small" id="coba-lagi">Coba lagi</button>' +
            "</div>";
        el.daftar.appendChild(li);
        return;
    }

    const hasil = tugasTerfilter();

    if (hasil.length === 0) {
        let judulKosong = "Daftar masih kosong";
        let pesanKosong = "Belum ada tugas. Tambahkan tugas pertamamu lewat form di samping.";

        if (state.pencarian) {
            judulKosong = "Tidak ditemukan";
            pesanKosong =
                'Tidak ada tugas yang cocok dengan pencarian "' + state.pencarian + '".';
        } else if (state.filter === "aktif") {
            pesanKosong = "Semua tugas sudah selesai. Kerja bagus!";
        } else if (state.filter === "selesai") {
            pesanKosong = "Belum ada tugas yang ditandai selesai.";
        }

        const li = document.createElement("li");
        li.innerHTML =
            '<div class="empty">' +
            '<div class="empty__icon">' + ICON.empty + "</div>" +
            "<h3>" + esc(judulKosong) + "</h3>" +
            "<p>" + esc(pesanKosong) + "</p>" +
            "</div>";
        el.daftar.appendChild(li);
        return;
    }

    hasil.forEach(function (item) {
        el.daftar.appendChild(buatKartu(item));
    });
}

function buatKartu(item) {
    const li = document.createElement("li");
    const status = statusTugas(item);
    const terlambat = status.label === "Terlambat";

    li.className = "task" + (item.selesai ? " task--done" : "");
    li.dataset.id = item.id;

    li.innerHTML =
        '<label class="task__check" title="' +
        (item.selesai ? "Tandai belum selesai" : "Tandai selesai") +
        '">' +
        '<input type="checkbox" class="checkbox" ' +
        (item.selesai ? "checked " : "") +
        'aria-label="Tandai ' +
        esc(item.judul) +
        (item.selesai ? " belum selesai" : " selesai") +
        '">' +
        '<span class="checkmark" aria-hidden="true"></span>' +
        "</label>" +
        '<div class="task__body">' +
        '<div class="task__top">' +
        '<h3 class="task__title">' + esc(item.judul) + "</h3>" +
        '<span class="badge ' + status.kelas + '">' + status.label + "</span>" +
        "</div>" +
        '<div class="task__meta">' +
        '<span class="meta-chip">' + ICON.book + esc(item.matkul) + "</span>" +
        '<span class="meta-chip ' + (terlambat ? "meta-chip--late" : "") + '">' +
        ICON.calendar + formatTanggal(item.deadline) +
        "</span>" +
        "</div>" +
        "</div>" +
        '<div class="task__actions">' +
        '<button type="button" class="btn btn--ghost btn--small btn-edit">Edit</button>' +
        '<button type="button" class="btn btn--danger btn--small btn-hapus">Hapus</button>' +
        "</div>";

    return li;
}

// ============================================================
// Tambah data (POST)
// ============================================================

el.form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (el.tombolTambah.disabled) {
        return;
    }

    const judul = el.judul.value.trim();
    const matkul = el.matkul.value;
    const deadline = el.deadline.value;
    const pesan = validasiForm(judul, matkul, deadline);

    if (pesan) {
        tampilkanError(el.formError, pesan);
        return;
    }

    tampilkanError(el.formError, "");
    setTombolSibuk(el.tombolTambah, true, "Menambahkan...", "Tambah Tugas");

    try {
        const baru = await api("/tugas", {
            method: "POST",
            body: JSON.stringify({ judul: judul, matkul: matkul, deadline: deadline })
        });

        state.tugas.push(baru);
        el.form.reset();
        tampilkanToast("Tugas berhasil ditambahkan.");
        render();
        el.judul.focus();
    } catch (err) {
        tampilkanError(el.formError, err.message);
    } finally {
        setTombolSibuk(el.tombolTambah, false, "Menambahkan...", "Tambah Tugas");
    }
});

// ============================================================
// Ubah data (PUT) melalui modal
// ============================================================

function isiSelectMatkul(select, nilai) {
    const sudahAda = Array.from(select.options).some(function (opsi) {
        return opsi.value === nilai;
    });

    if (!sudahAda && nilai) {
        select.add(new Option(nilai, nilai));
    }

    select.value = nilai;
}

function bukaModal(item) {
    el.editId.value = item.id;
    el.editJudul.value = item.judul;
    isiSelectMatkul(el.editMatkul, item.matkul);
    el.editDeadline.value = item.deadline;
    el.editSelesai.checked = item.selesai;

    tampilkanError(el.editError, "");
    el.modal.showModal();
    el.editJudul.focus();
}

function tutupModal() {
    el.modal.close();
}

el.tutupModal.addEventListener("click", tutupModal);
el.batalEdit.addEventListener("click", tutupModal);

el.modal.addEventListener("click", function (event) {
    if (event.target === el.modal) {
        tutupModal();
    }
});

el.formEdit.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (el.tombolSimpan.disabled) {
        return;
    }

    const id = Number(el.editId.value);
    const judul = el.editJudul.value.trim();
    const matkul = el.editMatkul.value;
    const deadline = el.editDeadline.value;
    const pesan = validasiForm(judul, matkul, deadline);

    if (pesan) {
        tampilkanError(el.editError, pesan);
        return;
    }

    tampilkanError(el.editError, "");
    setTombolSibuk(el.tombolSimpan, true, "Menyimpan...", "Simpan Perubahan");

    try {
        const diperbarui = await api("/tugas/" + id, {
            method: "PUT",
            body: JSON.stringify({
                judul: judul,
                matkul: matkul,
                deadline: deadline,
                selesai: el.editSelesai.checked
            })
        });

        state.tugas = state.tugas.map(function (item) {
            return item.id === id ? diperbarui : item;
        });

        tutupModal();
        tampilkanToast("Tugas berhasil diperbarui.");
        render();
    } catch (err) {
        tampilkanError(el.editError, err.message);
    } finally {
        setTombolSibuk(el.tombolSimpan, false, "Menyimpan...", "Simpan Perubahan");
    }
});

// ============================================================
// Hapus (DELETE), edit, dan coba lagi — event delegation
// ============================================================

el.daftar.addEventListener("click", async function (event) {
    const tombol = event.target.closest("button");

    if (!tombol) {
        return;
    }

    if (tombol.id === "coba-lagi") {
        muat();
        return;
    }

    const kartu = tombol.closest(".task");

    if (!kartu) {
        return;
    }

    const id = Number(kartu.dataset.id);
    const item = state.tugas.find(function (data) {
        return data.id === id;
    });

    if (!item) {
        return;
    }

    if (tombol.classList.contains("btn-edit")) {
        bukaModal(item);
        return;
    }

    if (tombol.classList.contains("btn-hapus")) {
        const setuju = window.confirm('Hapus tugas "' + item.judul + '" dari daftar?');

        if (!setuju) {
            return;
        }

        tombol.disabled = true;

        try {
            await api("/tugas/" + id, { method: "DELETE" });

            state.tugas = state.tugas.filter(function (data) {
                return data.id !== id;
            });

            tampilkanToast("Tugas berhasil dihapus.");
            render();
        } catch (err) {
            tampilkanToast(err.message, "gagal");
            tombol.disabled = false;
        }
    }
});

// ============================================================
// Tandai selesai / belum selesai (PUT)
// ============================================================

el.daftar.addEventListener("change", async function (event) {
    if (!event.target.classList.contains("checkbox")) {
        return;
    }

    const kartu = event.target.closest(".task");
    const id = Number(kartu.dataset.id);
    const item = state.tugas.find(function (data) {
        return data.id === id;
    });

    if (!item) {
        return;
    }

    const selesaiBaru = event.target.checked;
    event.target.disabled = true;

    try {
        const diperbarui = await api("/tugas/" + id, {
            method: "PUT",
            body: JSON.stringify({
                judul: item.judul,
                matkul: item.matkul,
                deadline: item.deadline,
                selesai: selesaiBaru
            })
        });

        state.tugas = state.tugas.map(function (data) {
            return data.id === id ? diperbarui : data;
        });

        tampilkanToast(
            selesaiBaru ? "Tugas ditandai selesai." : "Tugas ditandai belum selesai."
        );
        render();
    } catch (err) {
        tampilkanToast(err.message, "gagal");
        render();
    }
});

// ============================================================
// Pencarian dan filter
// ============================================================

el.pencarian.addEventListener("input", function () {
    state.pencarian = el.pencarian.value;
    renderDaftar();
});

el.filter.addEventListener("click", function (event) {
    const tombol = event.target.closest("[data-filter]");

    if (!tombol) {
        return;
    }

    state.filter = tombol.dataset.filter;

    Array.from(el.filter.querySelectorAll(".filter__btn")).forEach(function (item) {
        item.classList.toggle("is-active", item === tombol);
    });

    renderDaftar();
});

// ============================================================
// Mulai
// ============================================================

muat();
