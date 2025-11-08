using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Linq;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Models;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCadastroCurso : Form
    {
        Curso _curso = new Curso();
        int id_escola;
        string idText;
        Login _login;
        string _CurrentUsername;
        public frmCadastroCurso(string currentUsername, int id)
        {
            InitializeComponent();
            id_escola = id;
            _CurrentUsername = currentUsername;
            CarregarGrid();
        }
        public void LimparCampos()
        {
            txtId.Clear();
            txtNome.Texts = "";
        }
        public void CarregarGrid()
        {
            dgvCursos.DataSource = _curso.ListCourses(id_escola);
        }
        private void btnCadastrar_Click(object sender, EventArgs e)
        {
            if(txtNome.Texts == "")
            {
                MessageBox.Show("Preencha o Campo", "Aviso!", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            _curso = new Curso()
            {
                Name = txtNome.Texts
            };
            _curso.Insert(id_escola);
            CarregarGrid();
            LimparCampos();
        }

        private void frmCadastroCurso_Load(object sender, EventArgs e)
        {
            LimparCampos();
            CarregarGrid();
            dgvCursos.Columns["id"].Visible = false;
            CarregarGrid();

        }

        private void dgvCursos_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = dgvCursos.Rows[e.RowIndex];

                // Recupere os valores das células


                idText = row.Cells["id"].Value.ToString();

                string nome = row.Cells["nome"].Value.ToString();
              

               
                txtNome.Texts = nome;
                txtId.Text = idText;

            }
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (idText == null)
            {
                
                return;
            }
            else
            {

                _curso = new Curso()
                {
                    Id = int.Parse(idText)
                };
                _curso.Delete();

                _curso = new Curso()
                {
                    idEscola = id_escola
                };
                dgvCursos.DataSource = _curso.ListCourses(id_escola);
                dgvCursos.Columns["id"].Visible = false;
                LimparCampos();
                CarregarGrid();
            
            }

        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu(_CurrentUsername, id_escola);
            check.Show();
            Close();
            CarregarGrid();
        }

        private void txtNome_TextChanged(object sender, EventArgs e)
        {

        }
    }
}


