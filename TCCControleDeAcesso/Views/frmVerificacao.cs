using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmVerificacao : Form
    {
        bool verificando;

        public frmVerificacao()
        {
            InitializeComponent();
            SerialPortManager.Port.DataReceived += serialPort_DataReceived;
        }

        private void btnVerificar_Click(object sender, EventArgs e)
        {
            if (!verificando)
            {
                SerialPortManager.Port.Write("!verify#");
                btnVerificar.Text = "Parar";
                progressBarVerificar.Value = 100;
                verificando = true;
            }
            else if (verificando)
            {
                SerialPortManager.Port.Write("!a#");
                btnVerificar.Text = "Verificar";
                progressBarVerificar.Value = 0;
                verificando = false;
            }
        }

        private void CarregarImagemDoAluno(int id)
        {
            string connectionString = "server=localhost;port=3307;uid=root;pwd=etecjau;database=accesscontrol;"; // Atualize conforme necessário
            string query = "SELECT foto FROM alunos WHERE id = @id";

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                try
                {
                    conn.Open();
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@id", id);

                        using (MySqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read() && !reader.IsDBNull(0))
                            {
                                byte[] imagemBytes = (byte[])reader["foto"];

                                using (MemoryStream ms = new MemoryStream(imagemBytes))
                                {
                                    pictureBox1.Image = Image.FromStream(ms);
                                }
                            }
                            else
                            {
                                pictureBox1.Image = null; // ou imagem padrão
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao carregar imagem: " + ex.Message);
                }
            }
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            string received = SerialPortManager.Port.ReadLine();
            aluno.Invoke(new Action(() => {
                if (received.StartsWith("!found"))
                {
                    received = received.Replace("!found", "");
                    received = received.Replace("#", "");
                    aluno.Text = received;

                    CarregarImagemDoAluno(int.Parse(received));

                    
                }
            }));
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }
    }
}
