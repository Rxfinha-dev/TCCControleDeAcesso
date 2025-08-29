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
using TCCControleDeAcesso.Models;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCadastroCurso : Form
    {
        Curso _curso = new Curso();
        int id_escola;
        string idText;
        public frmCadastroCurso(int id)
        {
            InitializeComponent();
            id_escola = id;
        }
        public void LimparCampos()
        {
            txtId.Clear();
            txtNome.Clear();
        }
        public void CarregarGrid()
        {

            _curso = new Curso() { };

            dgvCursos.DataSource = _curso.ListCourses(id_escola);
        }
        private void btnCadastrar_Click(object sender, EventArgs e)
        {
            if(txtNome.Text == "")
            {
                MessageBox.Show("Preencha o Campo", "Aviso!", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            _curso = new Curso()
            {
                Name = txtNome.Text
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

        }

        private void dgvCursos_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = dgvCursos.Rows[e.RowIndex];

                // Recupere os valores das células


                idText = row.Cells["id"].Value.ToString();

                string nome = row.Cells["nome"].Value.ToString();
              

               
                txtNome.Text = nome;
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
            
            }

        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu("", 0);
            check.Show();
            Hide();
        }
    }
}


