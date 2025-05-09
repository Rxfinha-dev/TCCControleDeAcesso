using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmListaAlunos : Form
    {
        CadastroAlunos cadastroAlunos;
        int id_escola;
        public string caminho;

        public frmListaAlunos(int idEsc)
        {
            InitializeComponent();
            id_escola = idEsc;
        }

        private void frmListaAlunos_Load(object sender, EventArgs e)
        {
            cadastroAlunos = new CadastroAlunos() {
                idEscola = id_escola
            };
           dgvAlunos.DataSource = cadastroAlunos.ListStudents();
        }

        private void linkSelectPhoto_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Filter = "Imagens|*.jpg;*.jpeg;*.png;*.bmp";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                caminho = ofd.FileName;
                pictureBox1.ImageLocation = caminho; // opcional: mostra a imagem
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            if (txtName.Text == string.Empty ||  txtIdade.Text == string.Empty || comboBox2.SelectedIndex == -1) return;
            cadastroAlunos = new CadastroAlunos()
            {
                Name = txtName.Text,
                rm = txtRm.Text,
                //idCurso = txtCurso.Text,
                idade= txtIdade.Text,
                serie = comboBox2.SelectedItem.ToString(),
                foto = File.ReadAllBytes(caminho),
                idEscola = id_escola
            };
            cadastroAlunos.Insert();

            cadastroAlunos = new CadastroAlunos()
            {
                idEscola = id_escola
            };
            dgvAlunos.DataSource = cadastroAlunos.ListStudents();
        }
    }

    
}
