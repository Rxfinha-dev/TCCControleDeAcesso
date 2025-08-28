using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCadastroCurso : Form
    {
        Curso _curso = new Curso();
        int idEscola;
        public frmCadastroCurso(int id)
        {
            InitializeComponent();
            idEscola = id;
        }
        public void LimparCampos()
        {
            txtId.Clear();
            txtNome.Clear();
        }
        public void CarregarGrid()
        {

            _curso = new Curso() { };
           
            dgvCursos.DataSource = _curso.ListCourses(idEscola);
        }
        private void btnCadastrar_Click(object sender, EventArgs e)
        {
            _curso = new Curso()
            {
                Name = txtNome.Text
            };
            _curso.Insert(idEscola);
            CarregarGrid();
            LimparCampos();
        }

        private void frmCadastroCurso_Load(object sender, EventArgs e)
        {
            LimparCampos();
            CarregarGrid();

        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu("", 0);
            check.Show();
            Hide();
        }
    }
}
